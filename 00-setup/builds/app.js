import react, { useState, useRef, useCallback, useEffect, createElement } from 'react';
import { useStdin, useInput, Text, Box, useApp, render } from 'ink';
import { proxy, useSnapshot, subscribe, snapshot } from 'valtio';
import { ScrollList } from 'ink-scroll-list';

const defaultState = {
  project: null, // wikipedia, wiktionary
  lang: null,
  namespaces: null, // { 0: true, 4: true } by namespace number
  source: null, // meta.wikimedia.org, local
  writer: null, // sqlite, duckdb
  // include: null, // {disambiguation, redirects}
  format: null // json, html
  // properties: null, // {summary, classification}
  // runtime: null //workers, chunks, resume
};
const order = Object.keys(defaultState);
const CONFIRM = 'confirm'; // final review page, kept out of userState

const store = proxy({
  userState: { ...defaultState },
  confirmed: false,
  // getters
  get livePage() {
    const key = order.find((k) => this.userState[k] === null);
    if (key === undefined && this.confirmed === false) {
      return CONFIRM
    }
    return key
  },
  // one entry per dialogue page, for the pagination indicator
  get steps() {
    const steps = order.map((key) => ({ key, done: this.userState[key] !== null }));
    steps.push({ key: CONFIRM, done: this.confirmed });
    return steps
  },
  // actions
  confirm: () => {
    store.confirmed = true;
  },
  // clear the previous answer so its page becomes live again
  // returns false when already on the first page
  goBack: () => {
    const live = store.livePage;
    const i = live === CONFIRM ? order.length : order.indexOf(live);
    if (i <= 0) {
      return false
    }
    store.userState[order[i - 1]] = null;
    return true
  }
});

const resetStore = (initialState = {}) => {
  store.userState = { ...defaultState, ...structuredClone(initialState) };
  store.confirmed = false;
};

// global keys - left/esc step backward, and close the dialogue from the first page
const useKeyboard = function (finish) {
  const { isRawModeSupported } = useStdin();
  useInput(
    (input, key) => {
      if (key.leftArrow || key.escape) {
        const wentBack = store.goBack();
        if (!wentBack) {
          finish();
        }
      }
      if (key.ctrl && input === 'c') {
        finish();
      }
    },
    { isActive: isRawModeSupported }
  );
};

const Show = ({ condition, fallback = null, children }) => {
  return condition ? /*#__PURE__*/react.createElement(react.Fragment, null, children) : /*#__PURE__*/react.createElement(react.Fragment, null, fallback)
};

// a non-checkable list row: 'show more' or 'Done'
const ActionRow = ({ label, isSelected, dim }) => {
  return (
    /*#__PURE__*/react.createElement(Box, { gap: 1, height: 1 }, /*#__PURE__*/react.createElement(Text, { bold: true, color: "blue" }, isSelected ? '❯' : ' '), /*#__PURE__*/react.createElement(Text, { bold: true, color: isSelected ? 'blue' : 'white', dimColor: dim && !isSelected }, label))
  )
};

// fold a long list to its first `collapseAt` rows, until expand() is called
// `startExpanded` forces it open (eg. when the default row would be hidden)
const useFold = (list, collapseAt, startExpanded = false) => {
  const [expanded, setExpanded] = useState(startExpanded || list.length <= collapseAt);
  const visible = expanded ? list : list.slice(0, collapseAt);
  return {
    expanded,
    expand: () => setExpanded(true),
    visible,
    hiddenCount: list.length - visible.length,
    moreIndex: expanded ? -1 : visible.length // index of the 'show more' row
  }
};

// one-line page heading: `Step 1: Project - Select which project...`
const Header = ({ title, description }) => {
  const { steps, livePage } = useSnapshot(store);
  const num = steps.findIndex((step) => step.key === livePage) + 1;
  return (
    /*#__PURE__*/react.createElement(Box, { height: 1, gap: 1 }, /*#__PURE__*/react.createElement(Text, { color: "white" }, "Step ", num, ":"), /*#__PURE__*/react.createElement(Text, { underline: true, color: "green" }, title || ''), /*#__PURE__*/react.createElement(Text, { dimColor: true }, "- ", description || ''))
  )
};

// radio-style list - enter, space or right-arrow selects the highlighted row
// long lists start folded at `collapseAt` rows, with a 'show more' row to unfold
const SinglePick = ({ list, title, description, onSelect, collapseAt = 5 }) => {
  // cursor starts on the default choice, so right-arrow accepts it
  const defaultIndex = Math.max(
    list.findIndex((obj) => obj.isDefault === true),
    0
  );
  const [selectedIndex, setSelectedIndex] = useState(defaultIndex);
  const fold = useFold(list, collapseAt, defaultIndex >= collapseAt);
  const { visible, moreIndex } = fold;
  const lastIndex = fold.expanded ? visible.length - 1 : moreIndex;

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    }
    if (key.downArrow) {
      setSelectedIndex((prev) => Math.min(prev + 1, lastIndex));
    }
    if (key.return || key.rightArrow || input === ' ') {
      if (selectedIndex === moreIndex) {
        fold.expand(); // cursor lands on the first revealed row
        return
      }
      onSelect(visible[selectedIndex].id);
    }
  });
  const isLongList = visible.length > 20;
  const rowMargin = isLongList ? 0 : 1;
  return (
    /*#__PURE__*/react.createElement(Box, { flexDirection: "column", padding: 2 }, /*#__PURE__*/react.createElement(Header, { title: title, description: description }), /*#__PURE__*/react.createElement(Box,
        { borderStyle: "single",
        borderColor: "grey",
        borderTop: false,
        borderLeft: true,
        borderBottom: false,
        borderRight: false,
        maxHeight: 20,
        maxWidth: 60,
        paddingLeft: 2,
        paddingTop: 1,
        paddingBottom: 1,
        marginBottom: 1,
        marginLeft: 4 }, /*#__PURE__*/react.createElement(ScrollList,
          { selectedIndex: selectedIndex,
          paddingLeft: 1,
          gap: 1,
          borderStyle: "singleDouble",
          borderColor: "grey",
          borderTop: false,
          borderLeft: false,
          borderBottom: isLongList,
          borderRight: false }, visible.map((obj, i) => {
            const isSelected = i === selectedIndex;
            return (
              /*#__PURE__*/react.createElement(Box, { key: i, gap: 1, paddingBottom: 0, height: 1, marginBottom: rowMargin }, /*#__PURE__*/react.createElement(Text, { bold: true, color: "blue" }, isSelected ? '❯' : ' '), /*#__PURE__*/react.createElement(Text, { bold: true }, isSelected ? '●' : '○'), /*#__PURE__*/react.createElement(Text,
                  { bold: obj.isDefault === true,
                  color: isSelected ? 'blue' : 'white',
                  dimColor: !isSelected }, obj.label), /*#__PURE__*/react.createElement(Text, { color: "grey" }, "- ", obj.description || ''))
            )
          }), fold.expanded ? null : (
            /*#__PURE__*/react.createElement(Box, { key: "more" }, /*#__PURE__*/react.createElement(ActionRow,
                { label: `▸ show ${fold.hiddenCount} more`,
                isSelected: selectedIndex === moreIndex,
                dim: true }))
          ))))
  )
};

// https://en.wikipedia.org/wiki/List_of_Wikipedias
// (as of Sep 2026)
var langs = [
  { id: 'en', name: 'English', count: 7239075 },
  { id: 'de', name: 'German', count: 3151082 },
  { id: 'fr', name: 'French', count: 2779332 },
  { id: 'sv', name: 'Swedish', count: 2628210 },
  { id: 'nl', name: 'Dutch', count: 2226581 },
  { id: 'es', name: 'Spanish', count: 2137005 },
  { id: 'ru', name: 'Russian', count: 2117569 },
  { id: 'it', name: 'Italian', count: 1986593 },
  { id: 'pl', name: 'Polish', count: 1707577 },
  { id: 'arz', name: 'Egyptian Arabic', count: 1633545 },
  { id: 'zh', name: 'Chinese', count: 1555559 },
  { id: 'ja', name: 'Japanese', count: 1518034 },
  { id: 'uk', name: 'Ukrainian', count: 1434190 },
  { id: 'ar', name: 'Arabic', count: 1332246 },
  { id: 'vi', name: 'Vietnamese', count: 1304229 },
  { id: 'war', name: 'Waray', count: 1266964 },
  { id: 'pt', name: 'Portuguese', count: 1182192 },
  { id: 'fa', name: 'Persian', count: 1090085 },
  { id: 'ce', name: 'Chechen', count: 867769 },
  { id: 'ca', name: 'Catalan', count: 803786 },
  { id: 'id', name: 'Indonesian', count: 795744 },
  { id: 'ko', name: 'Korean', count: 762561 },
  { id: 'tt', name: 'Tatar', count: 709106 },
  { id: 'sr', name: 'Serbian', count: 708597 },
  { id: 'tr', name: 'Turkish', count: 700295 },
  { id: 'ur', name: 'Urdu', count: 692383 },
  { id: 'no', name: 'Norwegian (Bokmål)', count: 690577 },
  { id: 'fi', name: 'Finnish', count: 624721 },
  { id: 'cs', name: 'Czech', count: 598331 },
  { id: 'hu', name: 'Hungarian', count: 573788 },
  { id: 'ro', name: 'Romanian', count: 548914 },
  { id: 'eu', name: 'Basque', count: 495226 },
  { id: 'sh', name: 'Serbo-Croatian', count: 461849 },
  { id: 'ms', name: 'Malay', count: 443687 },
  { id: 'zh-min-nan', name: 'Southern Min', count: 434624 },
  { id: 'he', name: 'Hebrew', count: 404772 },
  { id: 'eo', name: 'Esperanto', count: 389138 },
  { id: 'uz', name: 'Uzbek', count: 360971 },
  { id: 'hy', name: 'Armenian', count: 331680 },
  { id: 'da', name: 'Danish', count: 315871 },
  { id: 'bg', name: 'Bulgarian', count: 312068 },
  { id: 'simple', name: 'Simple English', count: 284979 },
  { id: 'cy', name: 'Welsh', count: 284634 },
  { id: 'el', name: 'Greek', count: 272825 },
  { id: 'be', name: 'Belarusian', count: 266412 },
  { id: 'et', name: 'Estonian', count: 261794 },
  { id: 'sk', name: 'Slovak', count: 261310 },
  { id: 'kk', name: 'Kazakh', count: 245131 },
  { id: 'azb', name: 'South Azerbaijani', count: 244850 },
  { id: 'hr', name: 'Croatian', count: 235370 },
  { id: 'gl', name: 'Galician', count: 233672 },
  { id: 'min', name: 'Minangkabau', count: 229951 },
  { id: 'lt', name: 'Lithuanian', count: 226750 },
  { id: 'az', name: 'Azerbaijani', count: 217200 },
  { id: 'sl', name: 'Slovene', count: 198980 },
  { id: 'ka', name: 'Georgian', count: 198918 },
  { id: 'bn', name: 'Bengali', count: 191329 },
  { id: 'ta', name: 'Tamil', count: 190231 },
  { id: 'th', name: 'Thai', count: 187619 },
  { id: 'lld', name: 'Ladin', count: 183221 },
  { id: 'nn', name: 'Norwegian (Nynorsk)', count: 179835 },
  { id: 'hi', name: 'Hindi', count: 171421 },
  { id: 'mk', name: 'Macedonian', count: 164528 },
  { id: 'zh-yue', name: 'Cantonese', count: 151904 },
  { id: 'lv', name: 'Latvian', count: 145676 },
  { id: 'la', name: 'Latin', count: 142297 },
  { id: 'ast', name: 'Asturian', count: 141244 },
  { id: 'af', name: 'Afrikaans', count: 130870 },
  { id: 'te', name: 'Telugu', count: 128667 },
  { id: 'sw', name: 'Swahili', count: 126685 },
  { id: 'tg', name: 'Tajik', count: 118962 },
  { id: 'ha', name: 'Hausa', count: 113107 },
  { id: 'my', name: 'Burmese', count: 112277 },
  { id: 'ceb', name: 'Cebuano', count: 6115734 },
  { id: 'sq', name: 'Albanian', count: 106304 },
  { id: 'mg', name: 'Malagasy', count: 103817 },
  { id: 'mr', name: 'Marathi', count: 103028 },
  { id: 'bs', name: 'Bosnian', count: 98731 },
  { id: 'ku', name: 'Kurdish', count: 92018 },
  { id: 'br', name: 'Breton', count: 91651 },
  { id: 'be-tarask', name: 'Belarusian (Classical)', count: 91280 },
  { id: 'oc', name: 'Occitan', count: 90901 },
  { id: 'ml', name: 'Malayalam', count: 88959 },
  { id: 'an', name: 'Aragonese', count: 86608 },
  { id: 'nds', name: 'Low German', count: 85951 },
  { id: 'ckb', name: 'Sorani Kurdish', count: 84362 },
  { id: 'lmo', name: 'Lombard', count: 80262 },
  { id: 'ky', name: 'Kyrgyz', count: 76542 },
  { id: 'mzn', name: 'Mazanderani', count: 76143 },
  { id: 'pnb', name: 'Western Punjabi', count: 75751 },
  { id: 'jv', name: 'Javanese', count: 75527 },
  { id: 'new', name: 'Newar', count: 74768 },
  { id: 'ht', name: 'Haitian Creole', count: 72093 },
  { id: 'pms', name: 'Piedmontese', count: 71562 },
  { id: 'vec', name: 'Venetian', count: 69624 },
  { id: 'lb', name: 'Luxembourgish', count: 67922 },
  { id: 'ga', name: 'Irish', count: 64381 },
  { id: 'ba', name: 'Bashkir', count: 64299 },
  { id: 'io', name: 'Ido', count: 64194 },
  { id: 'su', name: 'Sundanese', count: 62972 },
  { id: 'szl', name: 'Silesian', count: 61322 },
  { id: 'fy', name: 'West Frisian', count: 60720 },
  { id: 'is', name: 'Icelandic', count: 60455 },
  { id: 'pa', name: 'Punjabi', count: 59715 },
  { id: 'cv', name: 'Chuvash', count: 59188 },
  { id: 'vo', name: 'Volapük', count: 55643 },
  { id: 'tl', name: 'Tagalog', count: 49406 },
  { id: 'ig', name: 'Igbo', count: 48498 },
  { id: 'glk', name: 'Gilaki', count: 48310 },
  { id: 'wuu', name: 'Wu', count: 48308 },
  { id: 'diq', name: 'Zazaki', count: 42990 },
  { id: 'yo', name: 'Yoruba', count: 40631 },
  { id: 'ban', name: 'Balinese', count: 38866 },
  { id: 'shn', name: 'Shan', count: 38784 },
  { id: 'kn', name: 'Kannada', count: 34555 },
  { id: 'sco', name: 'Scots', count: 34255 },
  { id: 'als', name: 'Alemannic', count: 31796 },
  { id: 'gu', name: 'Gujarati', count: 30911 },
  { id: 'ia', name: 'Interlingua', count: 30583 },
  { id: 'ne', name: 'Nepali', count: 30054 },
  { id: 'avk', name: 'Kotava', count: 29906 },
  { id: 'crh', name: 'Crimean Tatar', count: 29733 },
  { id: 'mn', name: 'Mongolian', count: 28257 },
  { id: 'bar', name: 'Bavarian', count: 27233 },
  { id: 'scn', name: 'Sicilian', count: 26334 },
  { id: 'si', name: 'Sinhala', count: 25678 },
  { id: 'as', name: 'Assamese', count: 25477 },
  { id: 'bpy', name: 'Bishnupriya Manipuri', count: 25098 },
  { id: 'skr', name: 'Saraiki', count: 24665 },
  { id: 'qu', name: 'Quechua', count: 24640 },
  { id: 'nv', name: 'Navajo', count: 22668 },
  { id: 'bcl', name: 'Central Bikol', count: 22474 },
  { id: 'xmf', name: 'Mingrelian', count: 22453 },
  { id: 'sd', name: 'Sindhi', count: 22279 },
  { id: 'os', name: 'Ossetian', count: 21758 },
  { id: 'ff', name: 'Fula', count: 21471 },
  { id: 'ps', name: 'Pashto', count: 21351 },
  { id: 'frr', name: 'North Frisian', count: 21324 },
  { id: 'or', name: 'Odia', count: 21048 },
  { id: 'ary', name: 'Moroccan Arabic', count: 20359 },
  { id: 'tum', name: 'Tumbuka', count: 19500 },
  { id: 'sah', name: 'Yakut', count: 18240 },
  { id: 'bat-smg', name: 'Samogitian', count: 17276 },
  { id: 'cdo', name: 'Eastern Min', count: 16756 },
  { id: 'gd', name: 'Scottish Gaelic', count: 16062 },
  { id: 'bug', name: 'Buginese', count: 15970 },
  { id: 'sat', name: 'Santali', count: 15946 },
  { id: 'yi', name: 'Yiddish', count: 15812 },
  { id: 'am', name: 'Amharic', count: 15728 },
  { id: 'ilo', name: 'Ilocano', count: 15528 },
  { id: 'kaa', name: 'Karakalpak', count: 15506 },
  { id: 'li', name: 'Limburgish', count: 15219 },
  { id: 'gor', name: 'Gorontalo', count: 15132 },
  { id: 'nap', name: 'Neapolitan', count: 14968 },
  { id: 'dag', name: 'Dagbani', count: 14516 },
  { id: 'hyw', name: 'Western Armenian', count: 14508 },
  { id: 'mai', name: 'Maithili', count: 14362 },
  { id: 'eml', name: 'Emilian-Romagnol', count: 14307 },
  { id: 'zh-classical', name: 'Classical Chinese', count: 14302 },
  { id: 'hsb', name: 'Upper Sorbian', count: 14289 },
  { id: 'fo', name: 'Faroese', count: 14221 },
  { id: 'map-bms', name: 'Banyumasan', count: 13977 },
  { id: 'so', name: 'Somali', count: 13821 },
  { id: 'ie', name: 'Interlingue', count: 13774 },
  { id: 'ace', name: 'Acehnese', count: 13074 },
  { id: 'wa', name: 'Walloon', count: 13027 },
  { id: 'km', name: 'Khmer', count: 12864 },
  { id: 'zu', name: 'Zulu', count: 12674 },
  { id: 'sa', name: 'Sanskrit', count: 12555 },
  { id: 'hif', name: 'Fiji Hindi', count: 12478 },
  { id: 'bjn', name: 'Banjarese', count: 12361 },
  { id: 'zgh', name: 'Moroccan Amazigh', count: 12269 },
  { id: 'sn', name: 'Shona', count: 11833 },
  { id: 'ks', name: 'Kashmiri', count: 11620 },
  { id: 'lij', name: 'Ligurian', count: 11599 },
  { id: 'mhr', name: 'Meadow Mari', count: 11327 },
  { id: 'shi', name: 'Shilha', count: 10895 },
  { id: 'mni', name: 'Meitei', count: 10550 },
  { id: 'hak', name: 'Hakka', count: 10491 },
  { id: 'mrj', name: 'Hill Mari', count: 10430 },
  { id: 'rue', name: 'Rusyn', count: 10326 },
  { id: 'pam', name: 'Kapampangan', count: 10220 },
  { id: 'tly', name: 'Talysh', count: 10206 },
  { id: 'rw', name: 'Kinyarwanda', count: 9917 },
  { id: 'ug', name: 'Uyghur', count: 9733 },
  { id: 'roa-tara', name: 'Tarantino', count: 9508 },
  { id: 'co', name: 'Corsican', count: 9447 },
  { id: 'bh', name: 'Bhojpuri', count: 9208 },
  { id: 'nso', name: 'Northern Sotho', count: 9027 },
  { id: 'vls', name: 'West Flemish', count: 8361 },
  { id: 'bo', name: 'Tibetan', count: 8113 },
  { id: 'nds-nl', name: 'Dutch Low Saxon', count: 8108 },
  { id: 'mi', name: 'Māori', count: 8067 },
  { id: 'mt', name: 'Maltese', count: 7984 },
  { id: 'se', name: 'Northern Sámi', count: 7907 },
  { id: 'myv', name: 'Erzya', count: 7874 },
  { id: 'sc', name: 'Sardinian', count: 7841 },
  { id: 'mdf', name: 'Moksha', count: 7629 },
  { id: 'zea', name: 'Zeelandic', count: 7424 },
  { id: 'kw', name: 'Cornish', count: 7280 },
  { id: 'tk', name: 'Turkmen', count: 7231 },
  { id: 'kab', name: 'Kabyle', count: 7176 },
  { id: 'gv', name: 'Manx', count: 7125 },
  { id: 'vep', name: 'Veps', count: 7111 },
  { id: 'fiu-vro', name: 'Võro', count: 6912 },
  { id: 'gan', name: 'Gan', count: 6818 },
  { id: 'smn', name: 'Inari Sámi', count: 6744 },
  { id: 'ab', name: 'Abkhaz', count: 6741 },
  { id: 'pcd', name: 'Picard', count: 6139 },
  { id: 'gn', name: 'Guarani', count: 6035 },
  { id: 'udm', name: 'Udmurt', count: 5916 },
  { id: 'frp', name: 'Franco-Provençal', count: 5840 },
  { id: 'kv', name: 'Komi', count: 5823 },
  { id: 'lg', name: 'Luganda', count: 5816 },
  { id: 'csb', name: 'Kashubian', count: 5784 },
  { id: 'fur', name: 'Friulian', count: 5736 },
  { id: 'pap', name: 'Papiamento', count: 5728 },
  { id: 'gpe', name: 'Ghanaian Pidgin', count: 5681 },
  { id: 'tn', name: 'Tswana', count: 5632 },
  { id: 'lo', name: 'Lao', count: 5602 },
  { id: 'mad', name: 'Madurese', count: 5470 },
  { id: 'fon', name: 'Fon', count: 5403 },
  { id: 'ay', name: 'Aymara', count: 5290 },
  { id: 'ang', name: 'Old English', count: 5269 },
  { id: 'ln', name: 'Lingala', count: 5254 },
  { id: 'nrm', name: 'Norman', count: 5059 },
  { id: 'olo', name: 'Livvi-Karelian', count: 5035 },
  { id: 'tw', name: 'Twi', count: 4735 },
  { id: 'lfn', name: 'Lingua Franca Nova', count: 4684 },
  { id: 'tok', name: 'Toki Pona', count: 4614 },
  { id: 'lez', name: 'Lezgian', count: 4497 },
  { id: 'mwl', name: 'Mirandese', count: 4350 },
  { id: 'mnw', name: 'Mon', count: 4335 },
  { id: 'ext', name: 'Extremaduran', count: 4263 },
  { id: 'stq', name: 'Saterland Frisian', count: 4195 },
  { id: 'tyv', name: 'Tuvan', count: 4122 },
  { id: 'lad', name: 'Judaeo-Spanish', count: 4091 },
  { id: 'av', name: 'Avar', count: 4015 },
  { id: 'tcy', name: 'Tulu', count: 3960 },
  { id: 'rm', name: 'Romansh', count: 3882 },
  { id: 'dty', name: 'Doteli', count: 3768 },
  { id: 'mag', name: 'Magahi', count: 3683 },
  { id: 'gom', name: 'Konkani', count: 3644 },
  { id: 'dga', name: 'Dagaare', count: 3478 },
  { id: 'koi', name: 'Komi-Permyak', count: 3471 },
  { id: 'dsb', name: 'Lower Sorbian', count: 3448 },
  { id: 'bew', name: 'Betawi', count: 3341 },
  { id: 'dv', name: 'Maldivian', count: 3235 },
  { id: 'blk', name: "Pa'O", count: 3144 },
  { id: 'ksh', name: 'Ripuarian', count: 3038 },
  { id: 'za', name: 'Zhuang', count: 3023 },
  { id: 'awa', name: 'Awadhi', count: 3009 },
  { id: 'gag', name: 'Gagauz', count: 3008 },
  { id: 'krc', name: 'Karachay-Balkar', count: 2972 },
  { id: 'bxr', name: 'Buryat', count: 2919 },
  { id: 'kge', name: 'Komering', count: 2909 },
  { id: 'haw', name: 'Hawaiian', count: 2894 },
  { id: 'cbk-zam', name: 'Chavacano', count: 2872 },
  { id: 'pfl', name: 'Palatine German', count: 2867 },
  { id: 'szy', name: 'Sakizaya', count: 2752 },
  { id: 'ki', name: 'Kikuyu', count: 2702 },
  { id: 'pag', name: 'Pangasinan', count: 2652 },
  { id: 'tay', name: 'Atayal', count: 2581 },
  { id: 'inh', name: 'Ingush', count: 2560 },
  { id: 'xh', name: 'Xhosa', count: 2547 },
  { id: 'iba', name: 'Iban', count: 2539 },
  { id: 'knc', name: 'Central Kanuri', count: 2122 },
  { id: 'st', name: 'Sotho', count: 2109 },
  { id: 'pdc', name: 'Pennsylvania Dutch', count: 2098 },
  { id: 'atj', name: 'Atikamekw', count: 2082 },
  { id: 'nov', name: 'Novial', count: 2066 },
  { id: 'to', name: 'Tongan', count: 2047 },
  { id: 'kcg', name: 'Tyap', count: 2031 },
  { id: 'kg', name: 'Kongo', count: 2025 },
  { id: 'tet', name: 'Tetum', count: 2001 },
  { id: 'dtp', name: 'Dusun', count: 1988 },
  { id: 'om', name: 'Oromo', count: 1971 },
  { id: 'kai', name: 'Karekare', count: 1925 },
  { id: 'arc', name: 'Classical Syriac', count: 1920 },
  { id: 'nia', name: 'Nias', count: 1810 },
  { id: 'fat', name: 'Fante', count: 1801 },
  { id: 'wo', name: 'Wolof', count: 1741 },
  { id: 'igl', name: 'Igala', count: 1727 },
  { id: 'fj', name: 'Fijian', count: 1726 },
  { id: 'jam', name: 'Jamaican Patois', count: 1719 },
  { id: 'kbp', name: 'Kabiye', count: 1716 },
  { id: 'guw', name: 'Gun', count: 1698 },
  { id: 'anp', name: 'Angika', count: 1694 },
  { id: 'isv', name: 'Interslavic', count: 1687 },
  { id: 'kbd', name: 'Kabardian', count: 1675 },
  { id: 'pcm', name: 'Nigerian Pidgin', count: 1656 },
  { id: 'nqo', name: "N'Ko", count: 1621 },
  { id: 'xal', name: 'Kalmyk', count: 1587 },
  { id: 'rki', name: 'Arakanese', count: 1564 },
  { id: 'rsk', name: 'Pannonian Rusyn', count: 1553 },
  { id: 'nah', name: 'Nahuatl', count: 1549 },
  { id: 'cu', name: 'Old Church Slavonic', count: 1497 },
  { id: 'bi', name: 'Bislama', count: 1488 },
  { id: 'bbc', name: 'Toba Batak', count: 1479 },
  { id: 'tpi', name: 'Tok Pisin', count: 1416 },
  { id: 'roa-rup', name: 'Aromanian', count: 1390 },
  { id: 'gur', name: 'Gurene', count: 1386 },
  { id: 'ee', name: 'Ewe', count: 1381 },
  { id: 'kus', name: 'Kusaal', count: 1380 },
  { id: 'jbo', name: 'Lojban', count: 1364 },
  { id: 'mos', name: 'Mooré', count: 1326 },
  { id: 'ty', name: 'Tahitian', count: 1251 },
  { id: 'syl', name: 'Sylheti', count: 1239 },
  { id: 'btm', name: 'Mandailing Batak', count: 1236 },
  { id: 'sm', name: 'Samoan', count: 1208 },
  { id: 'trv', name: 'Seediq', count: 1201 },
  { id: 'ss', name: 'Swazi', count: 1176 },
  { id: 'ts', name: 'Tsonga', count: 1165 },
  { id: 'ltg', name: 'Latgalian', count: 1156 },
  { id: 'ny', name: 'Chewa', count: 1148 },
  { id: 'ami', name: 'Amis', count: 1144 },
  { id: 'srn', name: 'Sranan Tongo', count: 1133 },
  { id: 'alt', name: 'Southern Altai', count: 1113 },
  { id: 'nup', name: 'Nupe', count: 1081 },
  { id: 'gcr', name: 'Guianan Creole', count: 1077 },
  { id: 'lbe', name: 'Lak', count: 1053 },
  { id: 'got', name: 'Gothic', count: 1035 },
  { id: 'chr', name: 'Cherokee', count: 1034 },
  { id: 'bm', name: 'Bambara', count: 930 },
  { id: 've', name: 'Venda', count: 923 },
  { id: 'rmy', name: 'Romani', count: 758 },
  { id: 'rn', name: 'Kirundi', count: 729 },
  { id: 'chy', name: 'Cheyenne', count: 719 },
  { id: 'guc', name: 'Wayuu', count: 709 },
  { id: 'pnt', name: 'Pontic', count: 678 },
  { id: 'ady', name: 'Adyghe', count: 647 },
  { id: 'ik', name: 'Iñupiaq', count: 597 },
  { id: 'ch', name: 'Chamorro', count: 583 },
  { id: 'bol', name: 'Bole', count: 474 },
  { id: 'tdd', name: 'Tai Nuea', count: 453 },
  { id: 'ann', name: 'Obolo', count: 437 },
  { id: 'iu', name: 'Inuktitut', count: 425 },
  { id: 'dz', name: 'Dzongkha', count: 386 },
  { id: 'pwn', name: 'Paiwan', count: 377 },
  { id: 'sg', name: 'Sango', count: 377 },
  { id: 'ti', name: 'Tigrinya', count: 366 },
  { id: 'din', name: 'Dinka', count: 339 },
  { id: 'nr', name: 'Southern Ndebele', count: 331 },
  { id: 'pi', name: 'Pali', count: 311 },
  { id: 'kaj', name: 'Jju', count: 305 },
  { id: 'ppl', name: 'Nawat', count: 261 },
  { id: 'bdr', name: 'Bajau Sama', count: 247 },
  { id: 'tig', name: 'Tigre', count:64}
];

const titleCase = function (str = '') {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  })
};

const round = (num) => {
  if (num > 1_000_000) {
    let n = Math.round(num / 100_000) / 10;
    return n.toLocaleString() + 'm'
  }
  if (num > 1_000) {
    let n = Math.round(num / 1_000);
    return n.toLocaleString() + 'k'
  }
  return num
};

const Page$7 = () => {
  const list = langs.map((obj) => {
    let desc = obj.name;
    if (store.userState.project === 'wikipedia') {
      desc += ' (' + round(obj.count) + ')';
    }
    return {
      id: obj.id,
      label: obj.id,
      description: desc,
      isDefault: obj.id === 'en'
    }
  });
  let desc = 'Which language ' + titleCase(store.userState.project) + '';
  // if (store.userState.project !== 'wikipedia') {
  // desc = 'Not all languages may be available for ' + store.userState.project
  // }
  return (
    /*#__PURE__*/react.createElement(Box, { flexDirection: "column" }, /*#__PURE__*/react.createElement(SinglePick,
        { title: "Language",
        description: desc,
        list: list,
        onSelect: (id) => (store.userState.lang = id) }))
  )
};

// build the initial { id: bool } map from isDefault flags
const initialChecked = (list) => {
  const obj = {};
  list.forEach((o) => {
    obj[String(o.id)] = o.isDefault === true;
  });
  return obj
};

// keep only the checked ids - {} when nothing is on
const onlyTrue = (checked) => {
  const obj = {};
  Object.keys(checked).forEach((id) => {
    if (checked[id] === true) {
      obj[id] = true;
    }
  });
  return obj
};

// checkbox-group sibling of SinglePick - space/enter toggles, 'Done' row or right-arrow submits
// long lists start folded at `collapseAt` rows, with a 'show more' row to unfold
const MultiPick = ({ list, title, description, onDone, collapseAt = 5 }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [checked, setChecked] = useState(() => initialChecked(list));
  const fold = useFold(list, collapseAt);
  const { visible, moreIndex } = fold;
  const doneIndex = fold.expanded ? visible.length : visible.length + 1; // trailing 'Done' row

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    }
    if (key.downArrow) {
      setSelectedIndex((prev) => Math.min(prev + 1, doneIndex));
    }
    if (key.rightArrow) {
      onDone(onlyTrue(checked)); // accept the current state from any row
      return
    }
    if (key.return || input === ' ') {
      if (selectedIndex === doneIndex) {
        onDone(onlyTrue(checked));
        return
      }
      if (selectedIndex === moreIndex) {
        fold.expand(); // cursor lands on the first revealed row
        return
      }
      const id = String(visible[selectedIndex].id);
      setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
    }
  });
  const isLongList = visible.length > 20;
  const rowMargin = isLongList ? 0 : 1;
  return (
    /*#__PURE__*/react.createElement(Box, { flexDirection: "column", padding: 2 }, /*#__PURE__*/react.createElement(Header, { title: title, description: description }), /*#__PURE__*/react.createElement(Box,
        { borderStyle: "single",
        borderColor: "grey",
        borderTop: false,
        borderLeft: true,
        borderBottom: false,
        borderRight: false,
        maxHeight: 20,
        maxWidth: 60,
        paddingLeft: 2,
        paddingTop: 1,
        paddingBottom: 1,
        marginBottom: 1,
        marginLeft: 4 }, /*#__PURE__*/react.createElement(ScrollList,
          { selectedIndex: selectedIndex,
          paddingLeft: 1,
          gap: 1,
          borderStyle: "singleDouble",
          borderColor: "grey",
          borderTop: false,
          borderLeft: false,
          borderBottom: isLongList,
          borderRight: false }, visible.map((obj, i) => {
            const isOn = checked[String(obj.id)] === true;
            const isSelected = i === selectedIndex;
            // green when checked, white while hovered (half-chosen), grey otherwise
            let color = 'grey';
            if (isOn) {
              color = 'green';
            } else if (isSelected) {
              color = 'white';
            }
            return (
              /*#__PURE__*/react.createElement(Box, { key: i, gap: 1, paddingBottom: 0, height: 1, marginBottom: rowMargin }, /*#__PURE__*/react.createElement(Text, { bold: true, color: "blue" }, isSelected ? '❯' : ' '), /*#__PURE__*/react.createElement(Text, { bold: true, color: color }, isOn ? '◉' : '○'), /*#__PURE__*/react.createElement(Text, { bold: isSelected, color: color }, obj.label), /*#__PURE__*/react.createElement(Text, { color: "grey" }, "- ", obj.description || ''))
            )
          }), fold.expanded ? null : (
            /*#__PURE__*/react.createElement(Box, { key: "more", marginBottom: rowMargin }, /*#__PURE__*/react.createElement(ActionRow,
                { label: `▸ show ${fold.hiddenCount} more`,
                isSelected: selectedIndex === moreIndex,
                dim: true }))
          ), /*#__PURE__*/react.createElement(Box, { key: "done" }, /*#__PURE__*/react.createElement(ActionRow, { label: "Done", isSelected: selectedIndex === doneIndex })))))
  )
};

// mediawiki namespace numbers - see https://www.mediawiki.org/wiki/Manual:Namespace
var namespaces = [
  { id: 0, name: 'Articles', description: 'main content pages', isDefault: true },
  { id: 1, name: 'Talk', description: 'article discussion' },
  { id: 2, name: 'User', description: 'user pages' },
  { id: 4, name: 'Project', description: 'policies and project pages' },
  { id: 6, name: 'File', description: 'image and media descriptions' },
  { id: 8, name: 'MediaWiki', description: 'interface messages' },
  { id: 10, name: 'Template', description: 'transcluded templates' },
  { id: 12, name: 'Help', description: 'help pages' },
  { id: 14, name: 'Category', description: 'category pages' },
  { id: 100, name: 'Portal', description: 'topic portals' },
  { id: 118, name: 'Draft', description: 'unpublished drafts' },
  { id: 828, name: 'Module', description: 'lua modules' }
];

const list$4 = namespaces.map((obj) => {
  return {
    id: obj.id,
    label: obj.name,
    description: obj.description,
    isDefault: obj.isDefault === true
  }
});

const Page$6 = () => {
  return (
    /*#__PURE__*/react.createElement(Box, { flexDirection: "column" }, /*#__PURE__*/react.createElement(MultiPick,
        { title: "Namespaces",
        description: "Which kinds of pages to include",
        list: list$4,
        onDone: (obj) => (store.userState.namespaces = obj) }))
  )
};

var projects = [
  { id: 'wikipedia', name: 'Wikipedia', bold: true },
  { id: 'wiktionary', name: 'Wiktionary' },
  { id: 'wikinews', name: 'Wikinews' },
  { id: 'wikibooks', name: 'Wikibooks' },
  { id: 'wikiquote', name: 'Wikiquote' },
  { id: 'wikisource', name: 'Wikisource' },
  { id: 'wikiversity', name: 'Wikiversity' },
  { id: 'wikivoyage', name: 'Wikivoyage' },
  { id: 'wikispecies', name: 'Wikispecies' },
  { id: 'wikifunctions', name: 'Wikifunctions' },
  { id: 'commons', name: 'Wikimedia Commons' },
  { id: 'wikidata', name: 'Wikidata' },
  { id: 'mediawiki', name: 'MediaWiki' }
  // { id: 'meta', name: 'Meta-Wiki' },
  // { id: 'incubator', name: 'Wikimedia Incubator' }
];

const list$3 = projects.map((obj) => {
  return {
    label: obj.name,
    id: obj.id,
    isDefault: obj.id === 'wikipedia'
  }
});

const Page$5 = () => {
  return (
    /*#__PURE__*/react.createElement(Box, { flexDirection: "column" }, /*#__PURE__*/react.createElement(SinglePick,
        { title: "Project",
        description: "Select which project you'd like to process",
        list: list$3,
        onSelect: (id) => (store.userState.project = id) }))
  )
};

const list$2 = [
  { label: 'Download', id: 'wikimedia', description: 'from wikimedia.org', isDefault: true },
  { label: 'Local Dump', id: 'local', description: 'Use a local .gz file' },
  {
    label: 'Third-party Download ↗',
    id: 'third-party',
    description: 'd/l from another server'
  }
];

const Page$4 = () => {
  return (
    /*#__PURE__*/react.createElement(Box, { flexDirection: "column" }, /*#__PURE__*/react.createElement(SinglePick,
        { title: "Source",
        description: "Where the dump file should come from",
        list: list$2,
        onSelect: (id) => (store.userState.source = id) }))
  )
};

const list$1 = [
  {
    label: 'Filesystem',
    id: 'filesystem',
    description: 'Pages as individual files',
    isDefault: true
  },
  { label: 'DuckDb', id: 'duckdb', description: 'Pages as rows in DuckDb' },
  { label: 'Sqlite', id: 'sqlite', description: 'Pages as rows in Sqlite' },
  { label: 'None', id: 'none', description: 'Console-only' }
];

const Page$3 = () => {
  return (
    /*#__PURE__*/react.createElement(Box, { flexDirection: "column" }, /*#__PURE__*/react.createElement(SinglePick,
        { title: "Writer",
        description: "Where the output should be written",
        list: list$1,
        onSelect: (id) => (store.userState.writer = id) }))
  )
};

const list = [
  { label: 'Json-sm', id: 'json-sm', description: 'Smaller json' },
  { label: 'Json-md', id: 'json-md', description: 'Medium json', isDefault: true },
  { label: 'Json-lg', id: 'json-lg', description: 'Larger json' },
  { label: 'Text', id: 'text', description: 'Cleaned plaintext' },
  { label: 'Html', id: 'html', description: 'Converted to HTML' },
  { label: 'Markdown', id: 'markdown', description: 'Converted to Markdown' }
];

const Page$2 = () => {
  return (
    /*#__PURE__*/react.createElement(Box, { flexDirection: "column" }, /*#__PURE__*/react.createElement(SinglePick,
        { title: "Output Format",
        description: "What shape should the output be in?",
        list: list,
        onSelect: (id) => (store.userState.format = id) }))
  )
};

const labels = {
  project: 'Project',
  lang: 'Language',
  namespaces: 'Namespaces',
  source: 'Source',
  writer: 'Writer',
  format: 'Format'
};

// namespace ids -> names, eg. { 0: true, 4: true } -> 'Articles, Project'
const namespaceNames = (obj) => {
  const names = Object.keys(obj).map((id) => {
    const found = namespaces.find((ns) => String(ns.id) === id);
    return found ? found.name : id
  });
  return names.length > 0 ? names.join(', ') : 'none'
};

const format = (key, value) => {
  if (key === 'namespaces') {
    return namespaceNames(value)
  }
  return String(value)
};

// final review of every answer - enter/space/right confirms, left/esc goes back
const Page$1 = () => {
  const { userState } = useSnapshot(store);
  useInput((input, key) => {
    if (key.return || key.rightArrow || input === ' ') {
      store.confirm();
    }
  });
  return (
    /*#__PURE__*/react.createElement(Box, { flexDirection: "column", padding: 2 }, /*#__PURE__*/react.createElement(Header, { title: "Confirm", description: "Review your choices" }), /*#__PURE__*/react.createElement(Box,
        { flexDirection: "column",
        borderStyle: "single",
        borderColor: "grey",
        borderTop: false,
        borderLeft: true,
        borderBottom: false,
        borderRight: false,
        paddingLeft: 3,
        paddingTop: 1,
        paddingBottom: 1,
        marginBottom: 1,
        marginLeft: 4 }, Object.keys(labels).map((key) => (
          /*#__PURE__*/react.createElement(Box, { key: key, height: 1 }, /*#__PURE__*/react.createElement(Text, { dimColor: true }, labels[key].padEnd(12)), /*#__PURE__*/react.createElement(Text, { color: "green" }, format(key, userState[key])))
        )), /*#__PURE__*/react.createElement(Box, { marginTop: 1 }, /*#__PURE__*/react.createElement(ActionRow, { label: "Confirm", isSelected: true })), /*#__PURE__*/react.createElement(Text, { dimColor: true }, "← back")))
  )
};

const pages = {
  project: Page$5,
  lang: Page$7,
  namespaces: Page$6,
  source: Page$4,
  writer: Page$3,
  format: Page$2,
  confirm: Page$1
};

const Page = function () {
  const { livePage } = useSnapshot(store);
  const PageComponent = pages[livePage];
  return (
    /*#__PURE__*/react.createElement(Box, null, /*#__PURE__*/react.createElement(Show, { condition: PageComponent }, /*#__PURE__*/react.createElement(PageComponent, null)), /*#__PURE__*/react.createElement(Show, { condition: !PageComponent }, /*#__PURE__*/react.createElement(Text, { dimColor: true }, 'Error: no page ' + livePage)))
  )
};

// horizontal pagination dots - ● done, ○ current (blue), ○ upcoming (dim)
const Steps = () => {
  const { steps, livePage } = useSnapshot(store);
  return (
    /*#__PURE__*/react.createElement(Box, { paddingLeft: 2, gap: 1, marginTop: 1 }, steps.map((step) => {
        if (step.done) {
          return /*#__PURE__*/react.createElement(Text, { key: step.key }, "●")
        }
        const isCurrent = step.key === livePage;
        return (
          /*#__PURE__*/react.createElement(Text, { key: step.key, bold: isCurrent, color: isCurrent ? 'white' : 'grey' }, "○")
        )
      }))
  )
};

const App = function ({ clear }) {
  const { livePage } = useSnapshot(store);
  const { exit } = useApp();
  const completed = useRef(false);
  const finish = useCallback(
    (state) => {
      clear?.();
      exit(state);
    },
    [clear, exit]
  );

  useKeyboard(finish);

  useEffect(() => {
    const complete = () => {
      if (store.livePage || completed.current) {
        return
      }
      completed.current = true;
      const output = structuredClone(snapshot(store.userState));
      finish(output);
    };
    const unsubscribe = subscribe(store, complete);
    complete();
    return unsubscribe
  }, [finish]);

  if (!livePage) return null
  return (
    /*#__PURE__*/react.createElement(Box, { width: "100%", overflow: "hidden", flexDirection: "column" }, /*#__PURE__*/react.createElement(Steps, null), /*#__PURE__*/react.createElement(Box, { flexDirection: "column", flexGrow: 1, flexShrink: 1, minHeight: 0, overflow: "hidden" }, /*#__PURE__*/react.createElement(Page, null)))
  )
};

const dialogue = async function () {
  let app;
  try {
    resetStore({});
    app = render(createElement(App, { clear: () => app?.clear() }), {
      alternateScreen: false,
      exitOnCtrlC: true
    });
    return await app.waitUntilExit()
  } finally {
    app?.unmount();
    app?.cleanup();
  }
};

export { dialogue as default };

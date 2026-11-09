import react, { useState, useRef, useCallback, useEffect, createElement } from 'react';
import { useStdin, useInput, Text, Box, useApp, render } from 'ink';
import { proxy, useSnapshot, subscribe, snapshot } from 'valtio';
import { ScrollList } from 'ink-scroll-list';

const defaultState = {
  project: null, // wikipedia, wiktionary
  lang: null
  // source: null, // wikimedia, local
  // destination: null, // sqlite, duckdb
  // include: null, // {disambiguation, redirects}
  // format: null, // json, html
  // properties: null, // {summary, classification}
  // runtime: null //workers, chunks, resume
};
const order = Object.keys(defaultState);

const store = proxy({
  userState: { ...defaultState },
  page: 0,
  // getters
  get doublePage() {
    return this.page * 2
  },
  get livePage() {
    return order.find((key) => this.userState[key] === null)
  },
  // actions
  nextPage: () => {
    store.page += 1;
  }
});

const resetStore = (initialState = {}) => {
  store.userState = { ...defaultState, ...structuredClone(initialState) };
  store.page = 0;
};

const useKeyboard = function (finish) {
  const { isRawModeSupported } = useStdin();
  useInput(
    (input, key) => {
      if (key.return) {
        store.nextPage();
      }
      if (key.escape || (key.ctrl && input === 'c')) {
        finish();
      }
    },
    { isActive: isRawModeSupported }
  );
};

const Show = ({ if: condition, fallback = null, children }) => {
  return condition ? /*#__PURE__*/react.createElement(react.Fragment, null, children) : /*#__PURE__*/react.createElement(react.Fragment, null, fallback)
};

const SinglePick = ({ list, onSelect }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    // Handle keyboard navigation in the parent
    useInput((_, key) => {
      if (key.upArrow) {
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      }
      if (key.downArrow) {
        setSelectedIndex((prev) => Math.min(prev + 1, list.length - 1));
      }
      if (key.return) {
        onSelect(list[selectedIndex].id);
      }
    });
    return (
      /*#__PURE__*/react.createElement(Box, { borderStyle: "single", height: 10 }, /*#__PURE__*/react.createElement(ScrollList, { selectedIndex: selectedIndex }, list.map((obj, i) => (
            /*#__PURE__*/react.createElement(Box, { key: i }, /*#__PURE__*/react.createElement(Text, { color: i === selectedIndex ? 'green' : 'white' }, i === selectedIndex ? '> ' : '  ', obj.label))
          ))))
    )
  };

const list$1 = [
  { id: 'fr', label: 'fr' },
  { id: 'en', label: 'en' },
  { id: 'es', label: 'es' }
];

const Project$1 = () => {
  return (
    /*#__PURE__*/react.createElement(Box, { flexDirection: "column" }, /*#__PURE__*/react.createElement(Text, { underline: true }, "Lang"), /*#__PURE__*/react.createElement(SinglePick, { list: list$1, onSelect: (id) => (store.userState.lang = id) }))
  )
};

const list = [
  { id: 1, label: 'One' },
  { id: 2, label: 'Two' },
  { id: 3, label: 'Three' }
];

const Project = () => {
  return (
    /*#__PURE__*/react.createElement(Box, { flexDirection: "column" }, /*#__PURE__*/react.createElement(Text, { underline: true }, "Project"), /*#__PURE__*/react.createElement(SinglePick, { list: list, onSelect: (id) => (store.userState.project = id) }))
  )
};

const pages = {
  project: Project,
  lang: Project$1
};

const App = function ({ clear }) {
  const { livePage } = useSnapshot(store);
  const { exit } = useApp();
  const completed = useRef(false);
  const finish = useCallback((state) => {
    clear?.();
    exit(state);
  }, [clear, exit]);
  const PageComponent = pages[livePage];
  useKeyboard(finish);

  useEffect(() => {
    const complete = () => {
      if (store.livePage || completed.current) return
      completed.current = true;
      finish(structuredClone(snapshot(store.userState)));
    };
    const unsubscribe = subscribe(store, complete);
    complete();
    return unsubscribe
  }, [finish]);

  if (!livePage) return null
  return (
    /*#__PURE__*/react.createElement(Box, { width: "100%", overflow: "hidden", flexDirection: "column" }, /*#__PURE__*/react.createElement(Box, { flexDirection: "column", flexGrow: 1, flexShrink: 1, minHeight: 0, overflow: "hidden" }, /*#__PURE__*/react.createElement(Text, null, "hello! ", livePage, " "), /*#__PURE__*/react.createElement(Show, { if: PageComponent, fallback: /*#__PURE__*/react.createElement(Text, { dimColor: true }, "done") }, /*#__PURE__*/react.createElement(PageComponent, null))))
  )
};

let running = false;

const dialogue = async function () {
  if (running) throw new Error('A dialogue is already running')
  running = true;
  let app;
  try {
    resetStore({});
    app = render(createElement(App, { clear: () => app?.clear() }), {
      alternateScreen: false,
      exitOnCtrlC: false
    });
    return await app.waitUntilExit()
  } finally {
    app?.unmount();
    app?.cleanup();
    running = false;
  }
};

export { dialogue as default };

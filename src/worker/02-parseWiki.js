// const wtf = require('wtf_wikipedia');
const wtf = require('/Users/spencer/mountain/wtf_wikipedia/src'); //TODO: changeme
const plugin = require('/Users/spencer/mountain/wtf_wikipedia/plugins/classify/src');
wtf.extend(plugin);
wtf.extend(require('/Users/spencer/mountain/wtf-nsfw/src'));
const chalk = require('chalk');
// const encode = require('./_encode');

//doesn't support fancy things like &copy; to ©, etc
const escapeXML = function (str) {
  return str
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&');
};

//get parsed json from the wiki markup
const parseWiki = function (page, options, worker) {
  try {
    page.wiki = escapeXML(page.wiki || '');
    // options.title = options.title || page.title
    const doc = wtf(page.wiki, options);
    //dont insert this if it's a redirect
    if (doc.isRedirect()) {
      worker.counts.redirects += 1;
      if (options.verbose_skip === true) {
        console.log(
          chalk.green('skipping redirect:   -   ') + chalk.yellow('"' + page.title + '"')
        );
      }
      return null;
    }
    if (doc.isDisambiguation()) {
      worker.counts.disambig += 1;
      if (options.verbose_skip === true) {
        console.log(
          chalk.green('skipping disambiguation: ') + chalk.yellow('"' + page.title + '"')
        );
      }
      return null;
    }

    worker.counts.pages += 1;
    //add-in the proper xml page-title
    doc.title(page.title);
    options.custom(doc, worker);

    return {};
  } catch (e) {
    console.log(chalk.red('\n---Error on "' + page.title + '"'));
    console.log(e);
    // console.log(page.wiki);
    return null;
  }
};

module.exports = parseWiki;

// const wtf = require('wtf_wikipedia');
const wtf = require('/Users/spencer/mountain/wtf_wikipedia/src'); //TODO: changeme
const plugin = require('/Users/spencer/mountain/wtf_wikipedia/plugins/classify/src');
wtf.extend(plugin);
const chalk = require('chalk');
const fs = require('fs');
// const encode = require('./_encode');

//doesn't support fancy things like &copy; to ©, etc
const escapeXML = function(str) {
  return str
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&');
};

//get parsed json from the wiki markup
const parseWiki = function(page, options, worker) {
  try {
    page.wiki = escapeXML(page.wiki || '');
    // options.title = options.title || page.title
    const doc = wtf(page.wiki, options);
    //dont insert this if it's a redirect
    if (options.skip_redirects === true && doc.isRedirect()) {
      worker.counts.redirects += 1;
      if (options.verbose_skip === true) {
        console.log(
          chalk.green('skipping redirect:   -   ') + chalk.yellow('"' + page.title + '"')
        );
      }
      return null;
    }
    if (options.skip_disambig === true && doc.isDisambiguation()) {
      worker.counts.disambig += 1;
      if (options.verbose_skip === true) {
        console.log(
          chalk.green('skipping disambiguation: ') + chalk.yellow('"' + page.title + '"')
        );
      }
      return null;
    }
    //add-in the proper xml page-title
    doc.title(page.title);
    options.custom(doc, worker, fs);

    return {};
  } catch (e) {
    console.log(chalk.red('\n---Error on "' + page.title + '"'));
    console.log(e);
    console.log(page.wiki);
    return null;
  }
};

module.exports = parseWiki;

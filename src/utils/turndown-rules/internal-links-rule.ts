import marked, { Token } from 'marked';
import * as _ from 'lodash';

import { normalizeTitle } from '../filename-utils';
import { OutputFormat } from '../../output-format';
import { yarleOptions } from '../../yarle';
import { getTurndownService } from '../turndown-service';
import { RuntimePropertiesSingleton } from '../../runtime-properties';

import { filterByNodeName } from './filter-by-nodename';
import { getAttributeProxy } from './get-attribute-proxy';
import { isTOC } from './../../utils/is-toc';

import { loggerInfo } from '../../utils/loggerInfo';

const EVERNOTE_HIGHLIGHT = '-evernote-highlight:true;';
const EVERNOTE_COLORHIGHLIGHT = '--en-highlight';
const BOLD = 'bold';
const ITALIC = 'italic';
const UNDERLINE = 'underline';
const STRIKETHROUGH = 'line-through'

export const removeBrackets = (str: string): string => {
    return str.replace(/\[|\]/g, '');
};
export const removeDoubleBackSlashes = (str: string): string => {
    return str.replace(/\\/g, '');
};
export const wikiStyleLinksRule = {
    filter: filterByNodeName('A'),
    replacement: (content: any, node: any) => {
        const nodeProxy = getAttributeProxy(node);
        const HIGHLIGHT_SEPARATOR = yarleOptions.outputFormat === OutputFormat.ObsidianMD ? '==' : '`' ;

        if (!nodeProxy.href) {
            return '';
        }

        let suffix = ''
        let prefix = ''
        if (nodeProxy.style) {  
            const nodeValue: string = nodeProxy.style.value;
            // loggerInfo(`--- link nodeValue: ${nodeValue}`);

            // this aims to care for bold text generated as <span style="font-weight: bold;">Bold</span>
            if (content !== '<YARLE_NEWLINE_PLACEHOLDER>') {
                const hasBold =  nodeValue.includes(BOLD);
                const hasItalic =  nodeValue.includes(ITALIC);
                const hasUnderline =  nodeValue.includes(UNDERLINE);
                const hasStrikeThrough = nodeValue.includes(STRIKETHROUGH);
                
                if (hasBold) {
                    suffix += '**'
                    prefix = '**' + prefix
                }
                if (hasItalic) {
                    suffix += '_'
                    prefix = '_' + prefix
                }
                if (hasStrikeThrough) {
                    suffix += '~~' 
                    prefix = '~~' + prefix
                }

                // if (hasUnderline) {return_string = `<u>${return_string}</u>`}
                
                if (nodeValue.includes(EVERNOTE_HIGHLIGHT) || nodeValue.includes(EVERNOTE_COLORHIGHLIGHT)) {
                    suffix += `${HIGHLIGHT_SEPARATOR}`
                    prefix = `${HIGHLIGHT_SEPARATOR}` + prefix
                }
            }
        }

        let internalTurndownedContent =
            getTurndownService(yarleOptions).turndown(removeBrackets(node.innerHTML));
        // loggerInfo(`--- internalTurndownedContent: ${internalTurndownedContent}`);
        internalTurndownedContent = removeDoubleBackSlashes(internalTurndownedContent);
        // loggerInfo(`--- internalTurndownedContent2: ${internalTurndownedContent}`);
        const lexer = new marked.Lexer({});
        const tokens = lexer.lex(internalTurndownedContent) as any;
        const extension = yarleOptions.addExtensionToInternalLinks ? '.md' : '';
        let token: any = {
            mdKeyword: '',
            text: internalTurndownedContent,
        };
        if (tokens.length > 0 && tokens[0]['type'] === 'heading') {
            token = tokens[0];
            token['mdKeyword'] = `${'#'.repeat(tokens[0]['depth'])} `;
        }
        const value = nodeProxy.href.value;
        const type = nodeProxy.type ? nodeProxy.type.value : undefined ;
        const realValue = yarleOptions.urlEncodeFileNamesAndLinks ? encodeURI(value) : value;

        if (type === 'file') {
            // console.log(`------------------file: ![[${realValue}]]`)
            return yarleOptions.outputFormat === OutputFormat.ObsidianMD
                ? `${prefix}![[${realValue}]]${suffix}`
                : getShortLinkIfPossible(token, value, prefix, suffix);
        }
        if (value.match(/^(https?:|www\.|file:|ftp:|mailto:)/)) {
            return getShortLinkIfPossible(token, value, prefix,suffix);
        }

        const displayName = token['text'];
        const mdKeyword = token['mdKeyword'];

        // handle ObsidianMD internal link display name
        const omitObsidianLinksDisplayName = yarleOptions.outputFormat === OutputFormat.ObsidianMD
            && yarleOptions.obsidianSettings.omitLinkDisplayName;
        const renderedObsidianDisplayName = omitObsidianLinksDisplayName ? '' : `|${displayName}`;

        if (value.startsWith('evernote://')) {
            const fileName = normalizeTitle(token['text']);
            const noteIdNameMap = RuntimePropertiesSingleton.getInstance();
            if (isTOC(noteIdNameMap.getCurrentNoteName())) {
                noteIdNameMap.addItemToTOCMap({ url: value, title: fileName });
            } else {
                noteIdNameMap.addItemToMap({ url: value, title: fileName });
            }

            const linkedNoteId = value;
            if (yarleOptions.outputFormat === OutputFormat.ObsidianMD) {
                // console.log(`-----------------internalLink?: ${mdKeyword}[[${linkedNoteId}${extension}${renderedObsidianDisplayName}]]`)
                return `${prefix}${mdKeyword}[[${linkedNoteId}${extension}${renderedObsidianDisplayName}]]${suffix}`;
            }
            
            return `${prefix}${mdKeyword}[${displayName}](${linkedNoteId}${extension})${suffix}`;
        }
        // console.log(`------------------outlink?: ${mdKeyword}[[${realValue}${renderedObsidianDisplayName}]]`)
        return (yarleOptions.outputFormat === OutputFormat.ObsidianMD)
        ? `${prefix}${mdKeyword}[[${realValue}${renderedObsidianDisplayName}]]${suffix}`
        : (yarleOptions.outputFormat === OutputFormat.StandardMD || yarleOptions.outputFormat === OutputFormat.LogSeqMD)
            ? `${prefix}${mdKeyword}[${displayName}](${realValue})${suffix}`
            : `${prefix}${mdKeyword}[[${realValue}]]${suffix}`;
    },
};

export const getShortLinkIfPossible = (token: any, value: string, prefix: string, suffix: string): string => {
    // console.log(`------------------return shortlink: ${token['mdKeyword']}[${token['text']}](${value})`)
    return (!token['text'] || _.unescape(token['text']) === _.unescape(value))
                ? yarleOptions.generateNakedUrls ? value : `${prefix}<${value}>${suffix}`
                : `${prefix}${token['mdKeyword']}[${token['text']}](${value})${suffix}`;
};

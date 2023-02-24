
import { yarleOptions } from '../../yarle';
import { OutputFormat } from '../../output-format';

import { filterByNodeName } from './filter-by-nodename';
import { getAttributeProxy } from './get-attribute-proxy';
import { loggerInfo } from '../../utils/loggerInfo';
import { strikethroughRule } from './strikethrough-rule';

const EVERNOTE_HIGHLIGHT = '-evernote-highlight:true;';
const EVERNOTE_COLORHIGHLIGHT = '--en-highlight';
const BOLD = 'bold';
const ITALIC = 'italic';
const UNDERLINE = 'underline';
const STRIKETHROUGH = 'line-through'
// const COLOR = ' color:';// from middle of the style
export const spanRule = {
    // filter: [filterByNodeName('SPAN'), 'font'],
    filter: filterByNodeName('SPAN'), 
    replacement: (content: any, node: any) => {
        const HIGHLIGHT_SEPARATOR = yarleOptions.outputFormat === OutputFormat.ObsidianMD ? '==' : '`' ;
        const nodeProxy = getAttributeProxy(node);
        // loggerInfo(`--- content: ${content}`);
        if (nodeProxy.style) {
            const nodeValue: string = nodeProxy.style.value;
            // loggerInfo(`--- nodeValue: ${nodeValue}`);

            // this aims to care for bold text generated as <span style="font-weight: bold;">Bold</span>
            if (content !== '<YARLE_NEWLINE_PLACEHOLDER>') {
                const hasBold =  nodeValue.includes(BOLD);
                const hasItalic =  nodeValue.includes(ITALIC);
                const hasUnderline =  nodeValue.includes(UNDERLINE);
                const hasStrikeThrough = nodeValue.includes(STRIKETHROUGH);
                // const hasColor =  nodeValue.includes(COLOR);
                
                //TODO: need to add strick through as well. 
                
                let return_string = content
                // if (hasBold && !hasItalic) { return `**${content}**`; }
                // if (!hasBold && hasItalic) { return `_${content}_`; }
                // if (hasBold && hasItalic) { return `_**${content}**_`; }
                if (hasBold && !hasItalic) {  return_string =  `**${content}**`; }
                if (!hasBold && hasItalic) {  return_string =   `_${content}_`; }
                if (hasBold && hasItalic) {  return_string =   `_**${content}**_`; }

                if (hasStrikeThrough) {return_string = `~~${return_string}~~`}
                
                // nodeValue could be "background-color: rgb(255, 239, 158); color: rgb(173, 0, 0); font-weight: bold; text-decoration: underline;"
                // nodeValue could also be "color: rgb(173, 0, 0); font-weight: bold; text-decoration: underline;"
                // if (hasUnderline) {return_string = `<font style="underline;">${return_string}</font>`}
                if (hasUnderline) {return_string = `<u>${return_string}</u>`}
                
                const hasColor =  nodeValue.match(/(?<!-)color:.+?;/) // to find 'color:' but not 'background-color:' // this returns array
                const hasColorStr = `${hasColor}` // conver it to string
                // loggerInfo(`-- hasColor: ${hasColor}`);
                if (hasColor && !hasColorStr.includes("rgb(0, 0, 0)") && !hasColorStr.includes("rgb(255, 255, 255)"))  { 
                    return_string = `<font style="${hasColor}">${return_string}</font>`
                    // loggerInfo(`--- return_string: ${return_string}`);
                    // loggerInfo(`--- hasColor.includes(rgb(255, 255, 255)): ${hasColor.includes(`rgb(255, 255, 255)`)}`);

                }
                // if (hasColor) {
                //     let what_color = nodeValue.split('color:')[1].split(';')[0] //should give us ' rgb(173, 0, 0)'
                //     return_string = `<font style="color:${what_color};">${return_string}</font>`
                // }
                // NOTE: highlight seems need to be outside of <font> to make it work.
                if (nodeValue.includes(EVERNOTE_HIGHLIGHT) || nodeValue.includes(EVERNOTE_COLORHIGHLIGHT)) {
                    return_string = return_string.replaceAll(HIGHLIGHT_SEPARATOR, '') // make sure only one set of highlights is applied
                    return_string =  `${HIGHLIGHT_SEPARATOR}${return_string}${HIGHLIGHT_SEPARATOR}`
                }
                return return_string
            }

            // return nodeValue.includes(EVERNOTE_HIGHLIGHT) || nodeValue.includes(EVERNOTE_COLORHIGHLIGHT) ?
            //     `${HIGHLIGHT_SEPARATOR}${content}${HIGHLIGHT_SEPARATOR}` :
            //     content;
            return content;
        }

        return content;
    },
};

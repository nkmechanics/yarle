import { yarleOptions } from '../../yarle';

import { filterByNodeName } from './filter-by-nodename';
import { getAttributeProxy } from './get-attribute-proxy';
import { OutputFormat } from './../../output-format';
// import { loggerInfo } from '../../utils/loggerInfo';

export const imagesRule = {
  filter: filterByNodeName('IMG'),
  replacement: (content: any, node: any) => {
    const nodeProxy = getAttributeProxy(node);

    if (!nodeProxy.src) {
      return '';
    }
    const value = nodeProxy.src.value;
    // const widthParam = node.width || '';
    // const heightParam = node.height || '';
    let widthParam = ''; // some size is number only, some size is number+px,e.g., 100px
    if ("width" in nodeProxy) {widthParam = nodeProxy.width.value.replace('px', '') } // check if the img has "width" key in nodeProxy
    let heightParam = '';
    if ("height" in nodeProxy) {heightParam = nodeProxy.height.value.replace('px', '')}
    // loggerInfo(`--- width value: ${nodeProxy.width.value}`);
    // loggerInfo(`--- widthParam: ${widthParam}`);
    let realValue = value;
    if (yarleOptions.sanitizeResourceNameSpaces) {
      realValue = realValue.replace(/ /g, yarleOptions.replacementChar);
    } else if (yarleOptions.urlEncodeFileNamesAndLinks) {
      realValue = encodeURI(realValue);
    }
    let sizeString = (widthParam || heightParam) ? ` =${widthParam}x${heightParam}` : '';

    // while this isn't really a standard, it is common enough
    if (yarleOptions.keepImageSize === OutputFormat.StandardMD || yarleOptions.keepImageSize === OutputFormat.LogSeqMD) {

      return `![](${realValue}${sizeString})`;
    } else if (yarleOptions.keepImageSize === OutputFormat.ObsidianMD) {
      sizeString = (widthParam || heightParam) ? `|${widthParam || 0}x${heightParam || 0}` : '';
      if (realValue.startsWith('./')) {
        return `![[${realValue}${sizeString}]]`;
      } else {
        return `![${sizeString}](${realValue})`;
      }
    }

    const useObsidianMD = yarleOptions.outputFormat === OutputFormat.ObsidianMD;
    if (useObsidianMD && !value.match(/^[a-z]+:/)) {
      return `![[${realValue}]]`;
    }

    const srcSpl = nodeProxy.src.value.split('/');

    return `![${srcSpl[srcSpl.length - 1]}](${realValue})`;
  },
};

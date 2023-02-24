import { yarleOptions } from '../../yarle';

import { filterByNodeName } from './filter-by-nodename';
import { getAttributeProxy } from './get-attribute-proxy';

export const newLineRule = { // this is for newline in table
    filter: filterByNodeName('BR'),
    replacement: (content: any, node: any) => {
        const nodeProxy = getAttributeProxy(node);

        return '<YARLE_NEWLINE_PLACEHOLDER>';
    },
};

export const newLineRule2 = { // this for my other notes that uses <br> for new line
    filter: filterByNodeName('BR'),
    replacement: (content: any, node: any) => {
        const nodeProxy = getAttributeProxy(node);

        return '\n';
    },
};

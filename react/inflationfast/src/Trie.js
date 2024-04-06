// Trie.js

class TrieNode {
    constructor() {
        this.children = {};
        this.items = {};
    }
}
  
export class Trie {
    constructor(objects = []) {
        this.root = new TrieNode();

        for (const obj of objects) {
            this.insert(obj);
        }
    }

    insert(obj) {
        let node = this.root;
        let searchValue = obj.searchValue.toLowerCase();

        for (const char of searchValue) {
            const child = node.children[char] || new TrieNode();
            if (!node.children[char]) {
                node.children[char] = child;
            }

            node = child;

        }

        node.items[obj.searchValue] = obj;
    }

    allItems(node, maxItems, items = []) {
        const nodeItems = Object.values(node.items);
        items.push(...nodeItems);

        for (const child in node.children) {
            this.allItems(node.children[child], maxItems, items);

            if (items.length >= maxItems) {
                break;
            }
        }

        return items.slice(0, maxItems);
    }

    search(searchValue, maxItems = 10) {
        searchValue = searchValue.toLowerCase();
        let node = this.root;
        for (const char of searchValue) {
            if (!node.children[char]) {
                return [];
            }
            node = node.children[char];
        }

        return this.allItems(node, maxItems);
    }
}
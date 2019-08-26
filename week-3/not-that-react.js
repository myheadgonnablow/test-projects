'use strict';

function App(appElement, document) {
    if (!new.target) {
        return new App(appElement);
    }

    return {
        createElement(tagName, attributes = {}, children = []) {
            let element = document.createElement(tagName);

            for (let name in attributes) {
                let value = attributes[name];
                if (name in element) {
                    element[name] = value;
                } else {
                    element.setAttribute(name, value);
                }
            }

            element.append(...children);

            return element;
        },
        createTextElement(text) {
            return document.createTextNode(text);
        },
        mountElement(element, parentNode = appElement) {
            return parentNode.appendChild(element);
        },
    };
}
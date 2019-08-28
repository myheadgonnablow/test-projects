'use strict';

function App(appContainer) {
    if (!new.target) {
        return new App(appContainer);
    }

    const document = appContainer.ownerDocument;

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
        mountElement(element, parentNode = appContainer) {
            return parentNode.appendChild(element);
        },
    };
}
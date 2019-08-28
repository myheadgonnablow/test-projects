'use strict';
const APP_CONTAINER_ID = 'app';

function createElements() {
    const appContainer = document.getElementById(APP_CONTAINER_ID);
    const app = new App(appContainer);
    let children = [app.createTextElement('Child 1'),
        app.createTextElement('Child 2'),
        app.createTextElement('Child 3'),
    ];

    let el = app.createElement('div', {
        class: 'ntr-created',
        style: 'border: solid 1px black; border-radius: 5px; width: fit-content; padding: 5px; margin: 5px;',
        textContent: 'Parent ---->',
    }, children);

    // el === parent, this is just to demonstrate how mount returns an element;
    let parent = app.mountElement(el); 

    app.mountElement(app.createElement('div', {textContent: 'Mount Later'}), parent);
}
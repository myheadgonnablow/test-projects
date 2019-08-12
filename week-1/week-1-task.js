'use strict';
const RECORD_SEPARATOR = `, `;
const BASE_URL = `https://swapi.co/api`;
const API = {
    PLANETS_URL: `${BASE_URL}/planets/`,
};

let planetsAndSpecies = [];
let failed = false;
const promise = fetch(API.PLANETS_URL)
    .then(response => response.json())
    .catch(err => {
        failed = true;
        console.log(err);
        throw new Error(`Network issues. Can't load planet list.`);
    }).then(json => json.results)
    .then(planets => {
        planetsAndSpecies = planets.map(planet => {
            return {
                planet: planet.name,
                residents: planet.residents
            };
        });
        return Promise.all(getFetchChildrenPromises(planets, `residents`));
    }).then(results => {
        const failedResults = results.filter(x => !x.ok);

        if (failedResults.length) {
            console.log(`'${failedResults.join(RECORD_SEPARATOR)}' failed to load.`);
        }

        if (failedResults.length === results.length) {
            failed = true;
            throw new Error(`No residents were loaded successfully.`);
        }
        return Promise.all(results.map(result => result.json()));
    }).catch(err => {
        if (failed) {
            throw err;
        }
        console.log(err);
        failed = true;
        throw new Error(`Network issues. Can't load residents list.`);
    }).then(residents => {

        planetsAndSpecies = planetsAndSpecies.map(planetInfo => {
            return {
                planet: planetInfo.planet,
                residents: planetInfo.residents.map(resident => residents.find(x => x.url === resident))
            };
        });
        return Promise.all(getFetchChildrenPromises(residents, `species`))
    }).then(results => {
        const failedResults = results.filter(x => !x.ok);

        if (failedResults.length) {
            failed = true;
            throw new Error(`No possibility to load species.`);  
        }
        return Promise.all(results.map(result => result.json()));
    }).then(species => {
        if (failed) {
            throw err;
        }
        for (let planetInfo of planetsAndSpecies) {
            planetInfo.species = reduceChildren(planetInfo.residents, `species`)
                .map(speciesItem => species.find(x => x.url === speciesItem).name)
                .join(RECORD_SEPARATOR);
            delete planetInfo.residents;
        }
        console.table(planetsAndSpecies);
    }).catch(err => console.log(err));

function removeDuplicates(array) {
    return Array.from(new Set(array));
}

function reduceChildren(parents, childPropName) {
    return removeDuplicates(parents.reduce((accumulator, parentItem) =>
        accumulator.concat(parentItem[childPropName]), []));
}

function getFetchChildrenPromises(parents, childPropName) {
    return reduceChildren(parents, childPropName).map(childUrl => fetch(childUrl));
}
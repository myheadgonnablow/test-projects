'use strict';
const RECORD_SEPARATOR = `, `;
const BASE_URL = `https://swapi.co/api`;
const API = {
    PLANETS_URL: `${BASE_URL}/planets/`,
};

const HTTP_STATUS_CODES = {
    OK: 200,
};

logPlanetsAndSpecies(API.PLANETS_URL);

async function getPlanetsAndSpecies(planetsUrl) {
    const planetsResidentsSpecies = await fetchPlanetsResidentsSpecies(planetsUrl);
    return transformToPlanetsAndSpecies(...planetsResidentsSpecies);
}

async function fetchPlanetsResidentsSpecies(planetsUrl) {
    const planetJsons = await fetchMore({
        next: planetsUrl
    }, []);

    const planets = reduceChildren(planetJsons, `results`);

    const residentResponses = await Promise.all(getFetchChildrenPromises(planets, `residents`));
    logFailedResidents(residentResponses);
    const residents = await Promise.all(residentResponses.map(response => response.json()));
    const speciesResponses = await Promise.all(getFetchChildrenPromises(residents, `species`));
    const failedSpecies = speciesResponses.filter(x => !x.ok);

    if (failedSpecies.length) {
        throw new Error(`No possibility to load species.`);
    }

    const species = await Promise.all(speciesResponses.map(result => result.json()));

    return [planets, residents, species];
}

function transformToPlanetsAndSpecies(planets, residents, species) {
    return planets.map(planet => {

        const uniqueJointSpecies = getUniqueArray(
            planet.residents.map(residentUrl => leftJoinByUrl(residentUrl, residents).species.map(
                speciesUrl => leftJoinByUrl(speciesUrl, species).name)).flat()).join(RECORD_SEPARATOR);
        return {
            planet: planet.name,
            species: uniqueJointSpecies,
        };

    });
}

function leftJoinByUrl(entityUrl, entities) {
    return entities.find(x => x.url === entityUrl);
}

// it's not obvious from it's name that this one throws an exception
function logFailedResidents(residentResponses) {
    const failedResidents = residentResponses.filter(isFailed);
    if (failedResidents.length) {
        console.log(`'${failedResidents.join(RECORD_SEPARATOR)}' failed to load.`);
    }

    if (failedResidents.length === residentResponses.length) {
        throw new Error(`No residents were loaded successfully.`);
    }
}

async function logPlanetsAndSpecies(planetsUrl) {
    try {
        const planetsAndSpecies = await getPlanetsAndSpecies(planetsUrl);
        console.table(planetsAndSpecies);
    } catch (err) {
        console.log(err);
    }
}

function isFailed(response) {
    return response.status !== HTTP_STATUS_CODES.OK;
}

function fetchMore(json, jsons) {
    if (json.next) {
        return fetch(json.next).then(response => response.json()).then(json => {
            jsons.push(json);
            return fetchMore(json, jsons);
        });
    }

    return jsons;
}

function getUniqueArray(array) {
    return Array.from(new Set(array));
}

function reduceChildren(parents, childPropName) {
    return getUniqueArray(parents.reduce((accumulator, parentItem) =>
        accumulator.concat(parentItem[childPropName]), []));
}

function getFetchChildrenPromises(parents, childPropName) {
    return reduceChildren(parents, childPropName).map(childUrl => fetch(childUrl));
}
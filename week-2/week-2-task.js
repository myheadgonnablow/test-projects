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

async function logPlanetsAndSpecies(planetsUrl) {
    try {
        const planetsAndSpecies = await getPlanetsAndSpecies(planetsUrl);
        console.table(planetsAndSpecies);
    } catch (err) {
        console.log(err);
    }
}

async function getPlanetsAndSpecies(planetsUrl) {
    const planetsResidentsSpecies = await fetchPlanetsResidentsSpecies(planetsUrl);
    return transformToPlanetsAndSpecies(...planetsResidentsSpecies);
}

async function fetchPlanetsResidentsSpecies(planetsUrl) {
    const planets = await fetchPagedEntities(planetsUrl);
    const residentResponses = await Promise.all(getPromisesToFetchSubEntities(planets, `residents`));

    processFailedResidents(residentResponses);

    const residents = await Promise.all(residentResponses.map(response => response.json()));
    const speciesResponses = await Promise.all(getPromisesToFetchSubEntities(residents, `species`));

    processFailedSpecies(speciesResponses);

    const species = await Promise.all(speciesResponses.map(result => result.json()));

    return [planets, residents, species];
}

async function fetchPagedEntities(url) {
    let entities = [];
    let currentUrl = url;

    do {
        const response = await fetch(currentUrl);
        const json = await response.json();
        entities = entities.concat(json.results);
        currentUrl = json.next;
    } while (currentUrl !== null);

    return entities;
}

function processFailedSpecies(speciesResponses) {
    const failedSpecies = speciesResponses.filter(x => !x.ok);
    if (failedSpecies.length) {
        throw new Error(`No possibility to load species.`);
    }
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

function processFailedResidents(residentResponses) {
    const failedResidents = residentResponses.filter(isFailed);
    if (failedResidents.length) {
        console.log(`'${failedResidents.join(RECORD_SEPARATOR)}' failed to load.`);
    }

    if (failedResidents.length === residentResponses.length) {
        throw new Error(`No residents were loaded successfully.`);
    }
}

function isFailed(response) {
    return response.status !== HTTP_STATUS_CODES.OK;
}

function getUniqueArray(array) {
    return Array.from(new Set(array));
}

function getJointUniqueSubEntitiesArray(entities, subEntitiesPropName) {
    return getUniqueArray(entities.reduce((accumulator, entity) =>
        accumulator.concat(entity[subEntitiesPropName]), []));
}

function getPromisesToFetchSubEntities(entities, subEntitiesPropName) {
    return getJointUniqueSubEntitiesArray(entities, subEntitiesPropName).map(url => fetch(url));
}
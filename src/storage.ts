/// <reference path="../node_modules/@types/jstorage/index.d.ts"/>
import * as vistorian from './vistorian';
import * as main from 'vistorian-core/src/main';

var SESSION_TABLENAMES: string = "vistorian.tablenames";
var SESSION_TABLE: string = "vistorian.table";
var SESSION_NETWORK: string = "vistorian.network";
var SESSION_NETWORKIDS: string = "vistorian.networkIds";
var SESSION_SESSIONID: string = "vistorian.lastSessionId";

var SEP: string = "#";


// SESSION
export function saveSessionId(sessionid: string) {
    // console.log('save session', sessionid )
    $.jStorage.set("vistorian.lastSessionId", sessionid);
}

export function getLastSessionId(): string {
    var session: string = $.jStorage.get<string>("vistorian.lastSessionId");
    // console.log('get session, ', session)
    return session;
}



//////////////
/// TABLES ///
//////////////


// Stores all user's tables (tables must be in json format)
export function saveUserTable(table: any, sessionid: string) {
    // console.log('[vistorian] Save user table', table.name, sessionid);

    // add name to table names if not yet there.
    var tableNames: string[] = getTableNames(sessionid);
    var found: boolean = false;
    if (!tableNames) {
        tableNames = [];
    } else {
        tableNames.forEach(tableName => {
            if (tableName == table.name) {
                found = true;
            }
        })
    }
    if (!found) {
        // console.log('\tTable', table.name, 'not found. Table added.')
        tableNames.push(table.name);
        saveTableNames(tableNames, sessionid);
    } else {
        // console.log('\tTable', table.name, 'found. Replace table')
    }
    $.jStorage.set(sessionid + "#" + "vistorian.table" + "#" + table.name, table);
    // console.log('\tTable', table.name, 'added.', getTableNames(sessionid).length + ' tables stored.', getUserTable(table.name, sessionid))

}

// returns all users' tables
export function getUserTables(sessionid: string): vistorian.VTable[] {

    var tablenames: string[] = getTableNames(sessionid);
    var tables: vistorian.VTable[] = [];
    for (var i = 0; i < tablenames.length; i++) {
        tables.push($.jStorage.get<vistorian.VTable>(sessionid + "#" + "vistorian.table" + "#" + tablenames[i]));
    }

    return tables;
}

export function getUserTable(tablename: string, sessionid: string): vistorian.VTable {
    return $.jStorage.get<vistorian.VTable>(sessionid + "#" + "vistorian.table" + "#" + tablename)
}

export function getTableNames(sessionid: string): string[] {
    var names: string[] = $.jStorage.get<string[]>(sessionid + "#" + "vistorian.tablenames");
    // console.log('>>>names',names, sessionid + SEP + SESSION_TABLENAMES )
    if (names == undefined)
        names = []
    return names;
}
export function saveTableNames(tableNames: any, sessionid: string) {
    $.jStorage.set(sessionid + "#" + "vistorian.tablenames", tableNames);
}
export function deleteTable(table: vistorian.VTable, sessionid: string) {
    $.jStorage.deleteKey(sessionid + "#" + "vistorian.table" + "#" + table.name);

    var tableNames: string[] = getTableNames(sessionid);
    var found: boolean = false;
    if (!tableNames) {
        tableNames = [];
    } else {
        tableNames.forEach(tableName => {
            if (tableName == table.name) {
                found = true;
            }
        })
    }
    if (found) {
        tableNames.splice(tableNames.indexOf(table.name), 1);
        saveTableNames(tableNames, sessionid);
    }
    // console.log('table deleted', getTableNames(sessionid));
}






////////////////
/// NETWORKS ///
////////////////

export function getNetworkIds(sessionid: string): number[] {
    //var ids: number[] = [(<any>$.jStorage.get(sessionid + SEP + SESSION_NETWORKIDS)).id];
    var ids: number[] = $.jStorage.get(sessionid + "#" + "vistorian.networkIds");

    console.log('getNetworkIds :', sessionid, ids)
    if (ids == undefined)
        ids = []
    return ids;
}

export function saveNetwork(network: vistorian.Network, sessionid: string) {

    // add name to table names if not yet there.
    var networkIds: number[] = getNetworkIds(sessionid);
    var found: boolean = false;
    if (!networkIds) {
        networkIds = [];
    } else {
        console.log(networkIds);
        networkIds.forEach(networkId => {
            if (networkId == network.id) {
                found = true;
            }
        })
    }
    if (!found) {
        networkIds.push(network.id);
        saveNetworkIds(networkIds, sessionid);
        // console.log('Save imported networkId', network.id)
    }
    // console.log('save network', network)
    $.jStorage.set(sessionid + "#" + "vistorian.network" + "#" + network.id, network);

}

export function saveNetworkIds(networkIds: any, sessionid: string) {
    $.jStorage.set(sessionid + "#" + "vistorian.networkIds", networkIds);
}

export function getNetwork(networkId: string, sessionid: string): vistorian.Network {
    return $.jStorage.get<vistorian.Network>(sessionid + "#" + "vistorian.network" + "#" + networkId);
}

export function deleteNetwork(network: vistorian.Network, sessionid: string) {
    // console.log('deleteNetworkById', network.id, sessionid);
    main.deleteData(network.name);
    deleteNetworkById(network.id, sessionid);

}
export function deleteNetworkById(id: number, sessionid: string) {
    // console.log('deleteNetworkById', id, sessionid);

    // remove network tables from local storage: 

    $.jStorage.set(sessionid + "#" + "vistorian.network" + "#" + id, {});
    $.jStorage.deleteKey(sessionid + "#" + "vistorian.network" + "#" + id);

    var networkIds: number[] = getNetworkIds(sessionid);
    var found: boolean = false;
    if (!networkIds) {
        networkIds = [];
    } else {
        networkIds.forEach(networkId => {
            if (networkId == id) {
                found = true;
            }
        })
    }
    if (found) {
        networkIds.splice(networkIds.indexOf(id), 1);
        saveNetworkIds(networkIds, sessionid);
    }
    // console.log('[storage] Network removed', getNetworkIds().length, 'networks remaining.');
}

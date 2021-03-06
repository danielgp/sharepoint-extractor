var isNumber = require('is-number');
module.localFunctions = {
    decideBlackList: function (inEvaluatedValueForBlackList, inBlackListArray, inValueToEvaluate) {
        if (inEvaluatedValueForBlackList && (inBlackListArray.indexOf(inValueToEvaluate) === -1)) {
            return true;
        }
        return false;
    },
    decideWhiteList: function (inEvaluatedValueForWhiteList, inWhiteListArray, inValueToEvaluate) {
        if (inEvaluatedValueForWhiteList && (inWhiteListArray.indexOf(inValueToEvaluate) > -1)) {
            return true;
        }
        return false;
    },
    isNumeric: function (val) {
        return isNumber(val);
    },
    manageDateField: function (inCurrentList, crtIndex) {
        var crtResult = '';
        if ((inCurrentList[crtIndex] === null) || (inCurrentList[crtIndex] === undefined)) {
            crtResult = 'null';
        } else {
            crtResult = inCurrentList[crtIndex].replace('T', ' ').replace('Z', '');
        }
        return crtResult;
    },
    manageFieldsOfAllTypes: function (crtFieldAttributes, item) {
        if (crtFieldAttributes['Type'] === 'DateTime') {
            return module.localFunctions.manageDateField(item, crtFieldAttributes['Technical Name']);
        }
        var idFieldsType = ['Lookup', 'User'];
        if (idFieldsType.indexOf(crtFieldAttributes['Type']) > -1) {
            return item[crtFieldAttributes['Technical Name'] + 'Id'];
        }
        if (isNumber(item[crtFieldAttributes['Technical Name']])) {
            return item[crtFieldAttributes['Technical Name']];
        } else {
            return '"' + item[crtFieldAttributes['Technical Name']] + '"';
        }
    }
};
module.exports = {
    buildAuthenticationHeader: function (inAuthenticationArray) {
        var aReturn;
        switch (inAuthenticationArray.type) {
            case 'Addin':
                aReturn = inAuthenticationArray.credentials_Addin;
                break;
            case 'SAML':
                aReturn = inAuthenticationArray.credentials_SAML;
                break;
            default:
                aReturn = false;
                break;
        }
        return aReturn;
    },
    buildCurrentListAttributeValues: function (inObjectListsConfiguredAttributes, inCurrentList) {
        var crtListAttributes = [];
        Object.keys(inObjectListsConfiguredAttributes).map(function (itemList) {
            if (itemList.substring(0, 4) === 'Date') {
                crtListAttributes[itemList] = module.localFunctions.manageDateField(inCurrentList, inObjectListsConfiguredAttributes[itemList]);
            } else {
                crtListAttributes[itemList] = inCurrentList[inObjectListsConfiguredAttributes[itemList]];
            }
        });
        return crtListAttributes;
    },
    buildCurrentItemValues: function (fieldAttributes, item) {
        var crtRecord = [];
        var counterF = 0;
        Object.keys(fieldAttributes).map(function (itemF) {
            crtRecord[counterF] = module.localFunctions.manageFieldsOfAllTypes(fieldAttributes[itemF], item);
            counterF++;
        });
        return crtRecord;
    },
    buildCurrentRecordValues: function (inFieldsArray, crtRecordValues) {
        var specialColumns = ['Aggregations', 'HtmlSchemaXml'];
        var crtRecordGM = [];
        var counterGM = 0;
        Object.keys(inFieldsArray).map(function (itemGM) {
            if (specialColumns.indexOf(inFieldsArray[itemGM]) > -1) {
                crtRecordGM[counterGM] = '"' + JSON.stringify(crtRecordValues[inFieldsArray[itemGM]]) + '"';
            } else {
                if (isNumber(crtRecordValues[inFieldsArray[itemGM]])) {
                    crtRecordGM[counterGM] = crtRecordValues[inFieldsArray[itemGM]];
                } else {
                    crtRecordGM[counterGM] = '"' + crtRecordValues[inFieldsArray[itemGM]] + '"';
                }
            }
            counterGM++;
        });
        return crtRecordGM;
    },
    buildRequestQuery: function (targetSharePointURL, arStandardLists, crtListName, queryType, inData) {
        var queryPrefix = '';
        if (Object.keys(arStandardLists).indexOf(queryType) > -1) {
            queryPrefix = '_api/Web/' + arStandardLists[queryType]['APItrunk']
                    + '/' + arStandardLists[queryType]['APIfunction'] + '(\''
                    + crtListName + '\')/' + arStandardLists[queryType]['APIelement'];
        } else {
            queryPrefix = '_api/Web/' + queryType;
        }
        var headerOptions = inData.headers;
        headerOptions['Accept'] = 'application/json;odata=verbose';
        return {
            url: targetSharePointURL + queryPrefix,
            headers: headerOptions,
            json: true
        };
    },
    createOutputFileWithHeader: function (inParameters, fs) {
        var writeStream = fs.createWriteStream(inParameters['filePath'] + inParameters['fileName'] + '.csv', {encoding: 'utf8'}); // initiate file stream
        writeStream.write(inParameters['fileHeader'] + '"\n'); // Headers content
        return writeStream;
    },
    decideBlackListWhiteList: function (inDecisionValue, inBlackListArray, inWhiteListArray, inValueToEvaluate) {
        return (module.localFunctions.decideBlackList(inDecisionValue, inBlackListArray, inValueToEvaluate) || module.localFunctions.decideWhiteList(!inDecisionValue, inWhiteListArray, inValueToEvaluate));
    },
    internalQueryStructureArray: function (maxRecords) {
        return {
            'Fields': {'APItrunk': 'Lists', 'APIfunction': 'GetByTitle', 'APIelement': 'Fields'},
            'GroupMembers': {'APItrunk': 'SiteGroups', 'APIfunction': 'GetById', 'APIelement': 'Users'},
            'Items': {'APItrunk': 'Lists', 'APIfunction': 'GetByTitle', 'APIelement': 'Items' + '?$top=' + maxRecords},
            'Views': {'APItrunk': 'Lists', 'APIfunction': 'GetByTitle', 'APIelement': 'Views'}
        };
    },
    manageRequestIntoCSVfile: function (inParameters, crtListParameters, responseListRecord, fieldAttributes, fs) {
        var writeStream = module.exports.createOutputFileWithHeader({'filePath': inParameters['filePath'], 'fileName': inParameters['fileName'], 'fileHeader': '"' + Object.keys(fieldAttributes).join('"' + inParameters['ListSeparator'] + '"') + (crtListParameters['Versioning Enabled'] ? '"' + inParameters['ListSeparator'] + '"Version' : '')}, fs);
        if (Object.keys(responseListRecord.d.results).length > 0) {
            responseListRecord.d.results.forEach(function (itemFieldValue) {
                writeStream.write(module.exports.buildCurrentItemValues(fieldAttributes, itemFieldValue).join(inParameters['ListSeparator']) + (crtListParameters['Versioning Enabled'] ? inParameters['ListSeparator'] + itemFieldValue.OData__UIVersionString : '') + '\n'); // writing rows
            });
        }
        writeStream.end();
    }
};

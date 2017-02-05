module.localFunctions = {
    manageDateField: function (inCurrentList, crtIndex) {
        var crtResult = '';
        if (inCurrentList[crtIndex] === null) {
            crtResult = 'null';
        } else {
            crtResult = inCurrentList[crtIndex].replace('T', ' ').replace('Z', '');
        }
        return crtResult;
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
            switch (fieldAttributes[itemF]['Type']) {
                case 'DateTime':
                    crtRecord[counterF] = module.localFunctions.manageDateField(item, fieldAttributes[itemF]['Technical Name']);
                    break;
                case 'Lookup':
                case 'User':
                    crtRecord[counterF] = item[fieldAttributes[itemF]['Technical Name'] + 'Id'];
                    break;
                default:
                    crtRecord[counterF] = item[fieldAttributes[itemF]['Technical Name']];
                    break;
            }
            counterF++;
        });
        return crtRecord;
    },
    buildCurrentRecordValues: function (inFieldsArray, crtRecordValues) {
        var crtRecordGM = [];
        var counterGM = 0;
        Object.keys(inFieldsArray).map(function (itemGM) {
            if (inFieldsArray[itemGM] === 'HtmlSchemaXml') {
                crtRecordGM[counterGM] = JSON.stringify(crtRecordValues[inFieldsArray[itemGM]]);
            } else {
                crtRecordGM[counterGM] = crtRecordValues[inFieldsArray[itemGM]];
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
    decideBlackListWhiteList: function (inDecisionValue, inEvaluatedValueForBlackList, inBlackListArray, inEvaluatedValueForWhiteList, inWhiteListArray, inValueToEvaluate) {
        var bolReturn = false;
        if ((inDecisionValue === inEvaluatedValueForBlackList) && (inBlackListArray.indexOf(inValueToEvaluate) === -1)) {
            bolReturn = true;
        }
        if ((inDecisionValue === inEvaluatedValueForWhiteList) && (inWhiteListArray.indexOf(inValueToEvaluate) > -1)) {
            bolReturn = true;
        }
        return bolReturn;
    },
    internalQueryStructureArray: function (maxRecords) {
        return {
            'Fields': {'APItrunk': 'Lists', 'APIfunction': 'GetByTitle', 'APIelement': 'Fields'},
            'GroupMembers': {'APItrunk': 'SiteGroups', 'APIfunction': 'GetById', 'APIelement': 'Users'},
            'Items': {'APItrunk': 'Lists', 'APIfunction': 'GetByTitle', 'APIelement': 'Items' + '?$top=' + maxRecords},
            'Views': {'APItrunk': 'Lists', 'APIfunction': 'GetByTitle', 'APIelement': 'Views'}
        };
    }
};

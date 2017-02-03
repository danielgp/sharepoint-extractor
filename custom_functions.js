
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
                if (inCurrentList[inObjectListsConfiguredAttributes[itemList]] === null) {
                    crtListAttributes[itemList] = '';
                } else {
                    crtListAttributes[itemList] = inCurrentList[inObjectListsConfiguredAttributes[itemList]].replace('T', ' ').replace('Z', '');
                }
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
                    if (item[fieldAttributes[itemF]['Technical Name']] === null) {
                        crtRecord[counterF] = '';
                    } else {
                        crtRecord[counterF] = item[fieldAttributes[itemF]['Technical Name']].replace('T', ' ').replace('Z', '');
                    }
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
    buildRequestQuery: function (targetSharePointURL, arStandardLists, crtListName, queryType, inData) {
        var queryPrefix = '';
        if (Object.keys(arStandardLists).indexOf(queryType) > -1) {
            queryPrefix = '_api/Web/' + arStandardLists[queryType]['WebAPItrunk']
                    + '/' + arStandardLists[queryType]['WebAPIdeterminationFunction'] + '(\''
                    + crtListName + '\')/' + arStandardLists[queryType]['WebAPIdeterminationElement'];
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
            'Fields': {
                'WebAPItrunk': 'Lists',
                'WebAPIdeterminationFunction': 'GetByTitle',
                'WebAPIdeterminationElement': 'Fields'
            },
            'GroupMembers': {
                'WebAPItrunk': 'SiteGroups',
                'WebAPIdeterminationFunction': 'GetById',
                'WebAPIdeterminationElement': 'Users'
            },
            'Items': {
                'WebAPItrunk': 'Lists',
                'WebAPIdeterminationFunction': 'GetByTitle',
                'WebAPIdeterminationElement': 'Items' + '?$top=' + maxRecords
            },
            'Views': {
                'WebAPItrunk': 'Lists',
                'WebAPIdeterminationFunction': 'GetByTitle',
                'WebAPIdeterminationElement': 'Views'
            }
        };
    }
};

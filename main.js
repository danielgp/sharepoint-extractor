var spauth = require('node-sp-auth');
var request = require('request-promise');
var config = require('./config.json');
var targetSharePoint = require('./targetSharePoint.json');
var MyCustomFunctions = require('./custom_functions.js');
var fs = require('fs');

spauth
        .getAuth(targetSharePoint.URL, MyCustomFunctions.buildAuthenticationHeader(targetSharePoint.authentication))
        .then(function (data) {
            var internalQueryStructureGeneric = MyCustomFunctions.internalQueryStructureArray(0);
            request.get(MyCustomFunctions.buildRequestQuery(targetSharePoint.URL, internalQueryStructureGeneric, '', 'Lists', data)).then(function (responseList) {
                if (Object.keys(responseList.d.results).length > 0) {
                    var wStreamListViews = MyCustomFunctions.createOutputFileWithHeader({'filePath': config.General.PathForExtracts, 'fileName': config.General.MetaDataFileName.Views, 'fileHeader': '"List Name"' + config.General.ListSeparator + '"' + Object.keys(config.SharePoint.MetaDataOutput.Views).join('"' + config.General.ListSeparator + '"')}, fs);
                    var dataListLight = [];
                    var counter = 0;
                    responseList.d.results.forEach(function (itemList) {
                        dataListLight[counter] = MyCustomFunctions.buildCurrentListAttributeValues(config.SharePoint.MetaDataOutput.Lists, itemList);
                        counter++;
                    });
                    var wStreamList = MyCustomFunctions.createOutputFileWithHeader({'filePath': config.General.PathForExtracts, 'fileName': config.General.MetaDataFileName.Lists, 'fileHeader': '"' + Object.keys(dataListLight[0]).join('"' + config.General.ListSeparator + '"')}, fs);
                    var wStreamListFields = MyCustomFunctions.createOutputFileWithHeader({'filePath': config.General.PathForExtracts, 'fileName': config.General.MetaDataFileName.Fields, 'fileHeader': '"List"' + config.General.ListSeparator + '"' + Object.keys(config.SharePoint.MetaDataOutput.Fields).join('"' + config.General.ListSeparator + '"')}, fs);
                    dataListLight.forEach(function (crtListParameters) { // parse each List
                        if (MyCustomFunctions.decideBlackListWhiteList(!crtListParameters.Hidden, config.SharePoint.Filters.Lists.NotHidden.BlackList, config.SharePoint.Filters.Lists.Hidden.WhiteList, crtListParameters.Title)) { // check current List against configured BlackList and WhiteList besides considering user defined Lists
                            wStreamList.write('"' + Object.keys(crtListParameters).map(function (x) { // records detail of current List
                                return crtListParameters[x];
                            }).join('"' + config.General.ListSeparator + '"') + '"\n');
                            request.get(MyCustomFunctions.buildRequestQuery(targetSharePoint.URL, internalQueryStructureGeneric, crtListParameters.Title, 'Fields', data)).then(function (responseField) { // Dynamically detect structure of the list, extracting the Field names and their text to display
                                if (Object.keys(responseField.d.results).length > 0) {
                                    var fieldAttributes = [];
                                    responseField.d.results.forEach(function (itemField) {
                                        // check current Field against configured BlackList and WhiteList besides considering user defined Fields || for certain Lists all existing fields should be retrieved
                                        if (MyCustomFunctions.decideBlackListWhiteList(itemField.CanBeDeleted, config.SharePoint.Filters.Fields.CanBeDeleted.BlackList, config.SharePoint.Filters.Fields.CannotBeDeleted.WhiteList, itemField.InternalName) || (config.SharePoint.Filters.Lists.Hidden.WhiteList.indexOf(crtListParameters.Title) > -1)) {
                                            fieldAttributes[itemField.Title] = {'Technical Name': itemField.StaticName, 'Type': itemField.TypeAsString};
                                            wStreamListFields.write('"' + crtListParameters.Title + '"' + config.General.ListSeparator + '"' + MyCustomFunctions.buildCurrentRecordValues(config.SharePoint.MetaDataOutput.Fields, itemField).join('"' + config.General.ListSeparator + '"') + '"\n'); // fields of current List
                                        }
                                    });
                                    request.get(MyCustomFunctions.buildRequestQuery(targetSharePoint.URL, MyCustomFunctions.internalQueryStructureArray(crtListParameters.Records), crtListParameters.Title, 'Items', data)).then(function (responseListRecord) { // Get the actual values from current list
                                        MyCustomFunctions.manageRequestIntoCSVfile({'filePath': config.General.PathForExtracts, 'fileName': crtListParameters.Title, 'ListSeparator': config.General.ListSeparator}, crtListParameters, responseListRecord, fieldAttributes, fs);
                                    });
                                }
                            });
                            request.get(MyCustomFunctions.buildRequestQuery(targetSharePoint.URL, internalQueryStructureGeneric, crtListParameters.Title, 'Views', data)).then(function (responseViews) {
                                if (Object.keys(responseViews.d.results).length > 0) {
                                    responseViews.d.results.forEach(function (crtView) {
                                        wStreamListViews.write('"' + crtListParameters.Title + '"' + config.General.ListSeparator + '"' + MyCustomFunctions.buildCurrentRecordValues(config.SharePoint.MetaDataOutput.Views, crtView).join('"' + config.General.ListSeparator + '"') + '"\n'); // writing current Views record values
                                    });
                                }
                            });
                        }
                    });
                    wStreamList.end();
                }
            });
            request.get(MyCustomFunctions.buildRequestQuery(targetSharePoint.URL, internalQueryStructureGeneric, '', 'SiteGroups', data)).then(function (responseSiteGroups) {
                if (Object.keys(responseSiteGroups.d.results).length > 0) {
                    var wStreamGroups = MyCustomFunctions.createOutputFileWithHeader({'filePath': config.General.PathForExtracts, 'fileName': config.General.MetaDataFileName.SiteGroups, 'fileHeader': '"' + Object.keys(config.SharePoint.MetaDataOutput.SiteGroups).join('"' + config.General.ListSeparator + '"')}, fs);
                    var wStreamGroupMembers = MyCustomFunctions.createOutputFileWithHeader({'filePath': config.General.PathForExtracts, 'fileName': config.General.MetaDataFileName.SiteGroupMembers, 'fileHeader': '"Group"' + config.General.ListSeparator + '"' + Object.keys(config.SharePoint.MetaDataOutput.SiteGroupMembers).join('"' + config.General.ListSeparator + '"')}, fs);
                    responseSiteGroups.d.results.forEach(function (crtItemGroup) {
                        wStreamGroups.write('"' + MyCustomFunctions.buildCurrentRecordValues(config.SharePoint.MetaDataOutput.SiteGroups, crtItemGroup).join('"' + config.General.ListSeparator + '"') + '"\n'); // writing current record values
                        request.get(MyCustomFunctions.buildRequestQuery(targetSharePoint.URL, internalQueryStructureGeneric, crtItemGroup.Id, 'GroupMembers', data)).then(function (responseMembers) {
                            if (Object.keys(responseMembers.d.results).length > 0) {
                                responseMembers.d.results.forEach(function (crtItemGroupMember) {
                                    wStreamGroupMembers.write('"' + crtItemGroup.Title + '"' + config.General.ListSeparator + '"' + MyCustomFunctions.buildCurrentRecordValues(config.SharePoint.MetaDataOutput.SiteGroupMembers, crtItemGroupMember).join('"' + config.General.ListSeparator + '"') + '"\n'); // writing current record values
                                });
                            }
                        });
                    });
                    wStreamGroups.end();
                }
            });
        });

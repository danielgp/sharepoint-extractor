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
            var ListNameArray = [];
            request.get(MyCustomFunctions.buildRequestQuery(targetSharePoint.URL, internalQueryStructureGeneric, '', 'Lists', data)).then(function (response) {
                var dataObjectLists = response.d.results;
                if (Object.keys(dataObjectLists).length > 0) {
                    var wStreamListViews = fs.createWriteStream(config.General.PathForExtracts + config.General.MetaDataFileName.Views + '.csv', {encoding: 'utf8'}); // initiate MetaData for Views
                    wStreamListViews.write('"List Name"' + config.General.ListSeparator + '"' + Object.keys(config.SharePoint.MetaDataOutput.Views).join('"' + config.General.ListSeparator + '"') + '"\n'); // Headers for Views
                    var dataListLight = [];
                    var counter = 0;
                    dataObjectLists.forEach(function (item) {
                        dataListLight[counter] = MyCustomFunctions.buildCurrentListAttributeValues(config.SharePoint.MetaDataOutput.Lists, item);
                        ListNameArray[counter] = item.Title;
                        counter++;
                    });
                    var wStreamList = fs.createWriteStream(config.General.PathForExtracts + config.General.MetaDataFileName.Lists + '.csv', {encoding: 'utf8'}); // initiate MetaData for Lists
                    wStreamList.write('"' + Object.keys(dataListLight[0]).join('"' + config.General.ListSeparator + '"') + '"\n'); // headers of MetaData for Lists
                    var wStreamListFields = fs.createWriteStream(config.General.PathForExtracts + config.General.MetaDataFileName.Fields + '.csv', {encoding: 'utf8'}); // initiate MetaData for Fields
                    wStreamListFields.write('"List"' + config.General.ListSeparator + '"' + Object.keys(config.SharePoint.MetaDataOutput.Fields).join('"' + config.General.ListSeparator + '"') + '"\n'); // headers of MetaData for Fields
                    dataListLight.forEach(function (crtListParameters) { // parse each List
                        if (MyCustomFunctions.decideBlackListWhiteList(crtListParameters.Hidden, false, config.SharePoint.Filters.Lists.NotHidden.BlackList, true, config.SharePoint.Filters.Lists.Hidden.WhiteList, crtListParameters.Title)) { // check current List against configured BlackList and WhiteList besides considering user defined Lists
                            wStreamList.write('"' + Object.keys(crtListParameters).map(function (x) { // records detail of current List
                                return crtListParameters[x];
                            }).join('"' + config.General.ListSeparator + '"') + '"\n');
                            request.get(MyCustomFunctions.buildRequestQuery(targetSharePoint.URL, internalQueryStructureGeneric, crtListParameters.Title, 'Fields', data)).then(function (response) { // Dynamically detect structure of the list, extracting the Field names and their text to display
                                var dataObject = response.d.results;
                                if (Object.keys(dataObject).length > 0) {
                                    var fieldAttributes = [];
                                    var counter = 0;
                                    dataObject.forEach(function (item) {
                                        var crtRecordFieldWillBeExtracted = MyCustomFunctions.decideBlackListWhiteList(item.CanBeDeleted, true, config.SharePoint.Filters.Fields.CanBeDeleted.BlackList, false, config.SharePoint.Filters.Fields.CannotBeDeleted.WhiteList, item.InternalName); // check current Field against configured BlackList and WhiteList besides considering user defined Fields
                                        if (config.SharePoint.Filters.Lists.Hidden.WhiteList.indexOf(crtListParameters.Title) > -1) {  // for certain Lists all existing fields should be retrieved
                                            crtRecordFieldWillBeExtracted = true;
                                        }
                                        if (crtRecordFieldWillBeExtracted) {
                                            fieldAttributes[item.Title] = {
                                                'Technical Name': item.StaticName,
                                                'Type': item.TypeAsString
                                            };
                                            counter++;
                                            var crtListField = MyCustomFunctions.buildCurrentRecordValues(config.SharePoint.MetaDataOutput.Fields, item);
                                            wStreamListFields.write('"' + crtListParameters.Title + '"' + config.General.ListSeparator + '"' + crtListField.join('"' + config.General.ListSeparator + '"') + '"\n');
                                        }
                                    });
                                    var internalQueryStructureItem = MyCustomFunctions.internalQueryStructureArray(crtListParameters.Records);
                                    request.get(MyCustomFunctions.buildRequestQuery(targetSharePoint.URL, internalQueryStructureItem, crtListParameters.Title, 'Items', data)).then(function (response) { // Get the actual values from current list
                                        var wstream = fs.createWriteStream(config.General.PathForExtracts + crtListParameters.Title + '.csv', {encoding: 'utf8'});
                                        wstream.write('"' + Object.keys(fieldAttributes).join('"' + config.General.ListSeparator + '"') + (crtListParameters['Versioning Enabled'] ? '"' + config.General.ListSeparator + '"Version' : '') + '"\n'); // writing headers for records within current list
                                        var dataObjectValues = response.d.results;
                                        if (Object.keys(dataObjectValues).length > 0) {
                                            dataObjectValues.forEach(function (item) {
                                                var crtRecord = MyCustomFunctions.buildCurrentItemValues(fieldAttributes, item);
                                                wstream.write('"' + crtRecord.join('"' + config.General.ListSeparator + '"') + (crtListParameters['Versioning Enabled'] ? '"' + config.General.ListSeparator + '"' + item.OData__UIVersionString : '') + '"\n'); // writing current record values
                                            });
                                        }
                                        wstream.end();
                                    });
                                }
                            });
                            request.get(MyCustomFunctions.buildRequestQuery(targetSharePoint.URL, internalQueryStructureGeneric, crtListParameters.Title, 'Views', data)).then(function (responseViews) {
                                var dataViewObject = responseViews.d.results;
                                if (Object.keys(dataViewObject).length > 0) {
                                    dataViewObject.forEach(function (crtView) {
                                        var crtRecordView = MyCustomFunctions.buildCurrentRecordValues(config.SharePoint.MetaDataOutput.Views, crtView);
                                        wStreamListViews.write('"' + crtListParameters.Title + '"' + config.General.ListSeparator + '"' + crtRecordView.join('"' + config.General.ListSeparator + '"') + '"\n'); // writing current record values
                                    });
                                }
                            });
                        }
                    });
                    wStreamList.end();
                }
            });
            request.get(MyCustomFunctions.buildRequestQuery(targetSharePoint.URL, internalQueryStructureGeneric, '', 'SiteGroups', data)).then(function (response) {
                var dataObjectValues = response.d.results;
                if (Object.keys(dataObjectValues).length > 0) {
                    var wStreamGroups = fs.createWriteStream(config.General.PathForExtracts + config.General.MetaDataFileName.SiteGroups + '.csv', {encoding: 'utf8'}); // initiate MetaData for Groups
                    wStreamGroups.write('"' + Object.keys(config.SharePoint.MetaDataOutput.SiteGroups).join('"' + config.General.ListSeparator + '"') + '"\n'); // Headers for Groups
                    var wStreamGroupMembers = fs.createWriteStream(config.General.PathForExtracts + config.General.MetaDataFileName.SiteGroupMembers + '.csv', {encoding: 'utf8'}); // initiate MetaData for Group Members
                    wStreamGroupMembers.write('"Group"' + config.General.ListSeparator + '"' + Object.keys(config.SharePoint.MetaDataOutput.SiteGroupMembers).join('"' + config.General.ListSeparator + '"') + '"\n'); // Headers for Group Members
                    dataObjectValues.forEach(function (crtItemGroup) {
                        var crtRecord = MyCustomFunctions.buildCurrentRecordValues(config.SharePoint.MetaDataOutput.SiteGroups, crtItemGroup);
                        wStreamGroups.write('"' + crtRecord.join('"' + config.General.ListSeparator + '"') + '"\n'); // writing current record values
                        request.get(MyCustomFunctions.buildRequestQuery(targetSharePoint.URL, internalQueryStructureGeneric, crtItemGroup.Id, 'GroupMembers', data)).then(function (responseMembers) {
                            var dataObjectMemberValues = responseMembers.d.results;
                            if (Object.keys(dataObjectMemberValues).length > 0) {
                                dataObjectMemberValues.forEach(function (crtItemGroupMember) {
                                    var crtRecordGM = MyCustomFunctions.buildCurrentRecordValues(config.SharePoint.MetaDataOutput.SiteGroupMembers, crtItemGroupMember);
                                    wStreamGroupMembers.write('"' + crtItemGroup.Title + '"' + config.General.ListSeparator + '"' + crtRecordGM.join('"' + config.General.ListSeparator + '"') + '"\n'); // writing current record values
                                });
                            }
                        });
                    });
                    wStreamGroups.end();
                }
            });
        });

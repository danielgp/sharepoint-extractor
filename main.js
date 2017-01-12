var spauth = require('node-sp-auth');
var request = require('request-promise');
var config = require('./config.json');
var targetSharePoint = require('./targetSharePoint.json');
var MyCustomFunctions = require('./custom_functions.js');
var fs = require('fs');

spauth
        .getAuth(targetSharePoint.URL, MyCustomFunctions.buildAuthenticationHeader(targetSharePoint.authentication))
        .then(function (data) {
            var fsOptions = {
                encoding: 'utf8'
            };
            var headerOptions = data.headers;
            headerOptions['Accept'] = 'application/json;odata=verbose';
            var ListNameArray = [];
            request.get(MyCustomFunctions.buildRequestQuery(targetSharePoint.URL, '', 'Lists', headerOptions)).then(function (response) {
                var dataObjectLists = response.d.results;
                if (Object.keys(dataObjectLists).length > 0) {
                    var dataListLight = [];
                    var counter = 0;
                    dataObjectLists.forEach(function (item) {
                        dataListLight[counter] = MyCustomFunctions.buildCurrentListAttributeValues(config.SharePoint.MetaDataOutput.Lists, item);
                        ListNameArray[counter] = item.Title;
                        counter++;
                    });
                    var wStreamList = fs.createWriteStream(config.General.PathForExtracts + config.General.MetaDataFileName.Lists + '.csv', fsOptions); // initiate MetaData for Lists
                    wStreamList.write('"' + Object.keys(dataListLight[0]).join('"' + config.General.ListSeparator + '"') + '"\n'); // headers of MetaData for Lists
                    var wStreamListFields = fs.createWriteStream(config.General.PathForExtracts + config.General.MetaDataFileName.Fields + '.csv', fsOptions); // initiate MetaData for Fields
                    wStreamListFields.write('"List"' + config.General.ListSeparator + '"' + Object.keys(config.SharePoint.MetaDataOutput.Fields).join('"' + config.General.ListSeparator + '"') + '"\n'); // headers of MetaData for Fields
                    dataListLight.forEach(function (crtListParameters) { // parse each List
                        // check current List against configured BlackList and WhiteList besides considering user defined Lists
                        if (MyCustomFunctions.decideBlackListWhiteList(crtListParameters.Hidden, false, config.SharePoint.Filters.Lists.NotHidden.BlackList, true, config.SharePoint.Filters.Lists.Hidden.WhiteList, crtListParameters.Title)) {
                            wStreamList.write('"' + Object.keys(crtListParameters).map(function (x) { // records detail of current List
                                return crtListParameters[x];
                            }).join('"' + config.General.ListSeparator + '"') + '"\n');
                            // Dynamically detect structure of the list, extracting the Field names and their text to display
                            request.get(MyCustomFunctions.buildRequestQuery(targetSharePoint.URL, crtListParameters.Title, 'Fields', headerOptions)).then(function (response) {
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
                                            var crtListField = [];
                                            var counterF = 0;
                                            Object.keys(config.SharePoint.MetaDataOutput.Fields).forEach(function (itemF) {
                                                crtListField[counterF] = item[config.SharePoint.MetaDataOutput.Fields[itemF]];
                                                counterF++;
                                            });
                                            wStreamListFields.write('"' + crtListParameters.Title + '"' + config.General.ListSeparator + '"' + crtListField.join('"' + config.General.ListSeparator + '"') + '"\n');
                                        }
                                    });
                                    // Get the actual values from current list
                                    request.get(MyCustomFunctions.buildRequestQuery(targetSharePoint.URL, crtListParameters.Title, 'Items', headerOptions, crtListParameters.Records)).then(function (response) {
                                        var wstream = fs.createWriteStream(config.General.PathForExtracts + crtListParameters.Title + '.csv', fsOptions);
                                        wstream.write('"' + Object.keys(fieldAttributes).join('"' + config.General.ListSeparator + '"') + (crtListParameters['Versioning Enabled'] ? '"' + config.General.ListSeparator + '"Version' : '') + '"\n'); // writing headers for records within current list
                                        var dataObjectValues = response.d.results;
                                        if (Object.keys(dataObjectValues).length > 0) {
                                            dataObjectValues.forEach(function (item) {
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
                                                wstream.write('"' + crtRecord.join('"' + config.General.ListSeparator + '"') + (crtListParameters['Versioning Enabled'] ? '"' + config.General.ListSeparator + '"' + item.OData__UIVersionString : '') + '"\n'); // writing current record values
                                            });
                                        }
                                        wstream.end();
                                    });
                                }
                            });
                        }
                    });
                    wStreamList.end();
                }
            });
        });

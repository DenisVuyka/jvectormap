/*
* jVectorMap utils
* Copyright (c) 2013 Denis Vuyka
* License: MIT
* http://opensource.org/licenses/mit-license
*/
var jvm = jvm || {};
jvm.utils = jvm.utils || {};

jvm.utils.makeid = function () {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 5; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
};

jvm.utils.defs = function (map) {
    var defs = map.canvas.node.getElementsByTagName('defs');
    if (defs.length > 0) { return defs[0]; }

    defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    map.canvas.node.appendChild(defs);

    return defs;
};

jvm.utils.polarToCartesian = function (centerX, centerY, radius, angleInDegrees) {
    var angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;

    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
};

jvm.utils.describeArc = function (x, y, radius, startAngle, endAngle) {
    var start = jvm.utils.polarToCartesian(x, y, radius, endAngle);
    var end = jvm.utils.polarToCartesian(x, y, radius, startAngle);

    var arcSweep = endAngle - startAngle <= 180 ? "0" : "1";

    var d = [
        "M", start.x, start.y,
        "A", radius, radius, 0, arcSweep, 0, end.x, end.y
    ].join(" ");

    return d;
};

/*
Sample:
    jvm.utils.addArrowheadMarker(map, {
        id: someId,
        fill: 'black',
        stroke: 'black'
    })
*/
jvm.utils.addArrowheadMarker = function (map, options) {
    var marker = map.canvas.node.getElementById(options.id);
    if (marker) { return marker; }

    var defs = jvm.utils.defs(map);
    marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    defs.appendChild(marker);
    marker.setAttribute('id', options.id);
    marker.setAttribute('markerWidth', '5');
    marker.setAttribute('markerHeight', '5');
    marker.setAttribute('viewBox', '-6 -6 12 12');
    marker.setAttribute('refX', '-2');
    marker.setAttribute('refY', '0');
    marker.setAttribute('markerUnits', 'strokeWidth');
    marker.setAttribute('orient', 'auto');

    var polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    marker.appendChild(polygon);
    polygon.setAttribute('points', '-2,0 -5,5 5,0 -5,-5');
    polygon.setAttribute('fill', options.fill || 'red');
    polygon.setAttribute('stroke', options.stroke || 'black');
    polygon.setAttribute('stroke-width', '1');

    return marker;
};

jvm.utils.createMarkers = function (map, codes) {
    var markers = [];
    for (var i = 0; i < codes.length; i++) {
        var code = codes[i].toUpperCase();
        var country = jvm.utils.countries[code.toUpperCase()];
        if (country) {
            markers.push({ latLng: country.latlng, name: country.name });
        }
    }

    if (markers.length > 0) {
        map.createMarkers(markers);
    }
};

jvm.utils.Label = function (map, settings) {
    this.settings = settings;
    this.id = settings.id || jvm.utils.makeid();
    
    var offsetY = 0, offsetX = 0;

    if (settings.code) {
        var country = jvm.utils.countries[settings.code.toUpperCase()];
        if (country) {
            settings.location = country.latlng;
            if (!settings.text) {
                settings.text = country.name;
            }
        }
    }

    this.text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    map.canvas.node.appendChild(this.text);
    this.text.setAttribute('cursor', 'default');
    this.text.setAttribute('fill', this.settings.color || 'black');
    this.text.appendChild(document.createTextNode(settings.text || 'Label'));

    //var length = this.text.getComputedTextLength();
    var rect = this.text.getBBox();

    if (rect.height && rect.height > 0) {
        offsetY = (rect.height / 2) * -1;
    }

    if (rect.width && rect.width > 0) {
        offsetX = (rect.width / 2) * -1;
    }

    // public contract API
    this.updateLayout = function (m) {
        var loc = this.settings.location;
        var point = m.latLngToPoint(loc[0], loc[1]);
        this.text.setAttribute('x', point.x + offsetX || 0);
        this.text.setAttribute('y', point.y + offsetY || 0);
    };

    this.updateLayout(map);
};

jvm.utils.Arrow = function (map, settings) {
    if (!settings) throw new Error('Arrow settings not found.');
    
    jvm.utils.addArrowheadMarker(map, { id: 'arrow-black', fill: 'black' });
    jvm.utils.addArrowheadMarker(map, { id: 'arrow-red', fill: 'red', stroke: 'red' });
    jvm.utils.addArrowheadMarker(map, { id: 'arrow-green', fill: 'green', stroke: 'green' });
    jvm.utils.addArrowheadMarker(map, { id: 'arrow-blue', fill: 'blue', stroke: 'blue' });

    this.id = settings.id || jvm.utils.makeid();
    this.from = null;
    this.to = null;
    this.label = null;

    if (settings.from) {
        if (settings.from instanceof Array) {
            this.from = settings.from;
        } else if (typeof settings.from == 'string') {
            this.from = jvm.utils.countries[settings.from.toUpperCase()].latlng;
        }
    }

    if (!this.from) {
        throw new Error('Arrow source location not found.');
    }

    if (settings.to) {
        if (settings.to instanceof Array) {
            this.to = settings.to;
        } else if (typeof settings.to == 'string') {
            this.to = jvm.utils.countries[settings.to.toUpperCase()].latlng;
        }
    }

    if (!this.to) {
        throw new Error('Arrow destination location not found.');
    }

    var supportedColors = ['black', 'red', 'green', 'blue'];
    var color = settings.color.toLowerCase() || 'red';
    var arrowheadId = 'arrow-black';

    if (supportedColors.indexOf(color) >= 0) {
        arrowheadId = 'arrow-' + color;
    }

    this.path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    map.canvas.node.appendChild(this.path);

    this.path.setAttribute('fill', 'none');
    this.path.setAttribute('stroke', settings.color || 'red');
    this.path.setAttribute('stroke-width', '4');
    this.path.setAttribute('marker-end', 'url(#' + arrowheadId + ')');

    if (settings.text) {
        this.label = settings.text;
        this.tpath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        map.canvas.node.appendChild(this.tpath);
        this.tpath.setAttribute('id', this.id);

        var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('cursor', 'default');
        text.setAttribute('fill', settings.color || 'black');
        text.setAttribute('stroke', 'none');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '16px');
        text.setAttribute('font-family', 'sans-serif');
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('dy', '-10');
        map.canvas.node.appendChild(text);

        var textPath = document.createElementNS('http://www.w3.org/2000/svg', 'textPath');
        text.appendChild(textPath);
        textPath.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#' + this.id);
        textPath.setAttribute('startOffset', '50%');

        var textPathContent = document.createTextNode(settings.text);
        textPath.appendChild(textPathContent);
    }

    this.updateLayout = function (m) {
        var start = m.latLngToPoint(this.from[0], this.from[1]);
        var end = m.latLngToPoint(this.to[0], this.to[1]);
        this.path.setAttribute('d', ["M", start.x, start.y, "L", end.x, end.y].join(" "));
        if (this.label) {
            if (end.x > start.x) {
                this.tpath.setAttribute('d', ["M", start.x, start.y, "L", end.x, end.y].join(" "));
            } else {
                this.tpath.setAttribute('d', ["M", end.x, end.y, "L", start.x, start.y].join(" "));
            }
        }
    };

    this.updateLayout(map);
};

jvm.utils.CircularArrow = function (map, settings) {
    if (!settings) throw new Error('Arrow settings not found.');
    
    jvm.utils.addArrowheadMarker(map, { id: 'arrow-black', fill: 'black' });
    jvm.utils.addArrowheadMarker(map, { id: 'arrow-red', fill: 'red', stroke: 'red' });
    jvm.utils.addArrowheadMarker(map, { id: 'arrow-green', fill: 'green', stroke: 'green' });
    jvm.utils.addArrowheadMarker(map, { id: 'arrow-blue', fill: 'blue', stroke: 'blue' });

    this.id = settings.id || jvm.utils.makeid();
    this.location = settings.location;
    
    if (typeof settings.location == 'string') {
        this.location = jvm.utils.countries[settings.location.toUpperCase()].latlng;
    }
    
    this.r = settings.r || 20;
    
    var supportedColors = ['black', 'red', 'green', 'blue'];
    var color = (settings.color || 'red').toLowerCase();
    var arrowheadId = 'arrow-black';

    if (supportedColors.indexOf(color) >= 0) {
        arrowheadId = 'arrow-' + color;
    }

    var path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path1.setAttribute('stroke', settings.stroke || 'darkred');
    path1.setAttribute('stroke-width', settings['stroke-width'] || 4);
    path1.setAttribute('fill', settings.fill || 'none');
    path1.setAttribute('marker-start', 'url(#' + arrowheadId + ')');
    path1.setAttribute('marker-mid', 'url(#' + arrowheadId + ')');
    map.canvas.node.appendChild(path1);
    this.path1 = path1;

    var path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path2.setAttribute('stroke', settings.stroke || 'darkred');
    path2.setAttribute('stroke-width', settings['stroke-width'] || 4);
    path2.setAttribute('fill', settings.fill || 'none');
    path2.setAttribute('marker-start', 'url(#' + arrowheadId +')');
    path2.setAttribute('marker-mid', 'url(#' + arrowheadId + ')');
    map.canvas.node.appendChild(path2);
    this.path2 = path2;
    
    if (settings.text) {
        var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('cursor', 'default');
        text.setAttribute('font-weight', 'bold');
        var content = document.createTextNode(settings.text);
        text.appendChild(content);
        map.canvas.node.appendChild(text);
        
        var rect = text.getBBox();
        this.text = text;
        this.rect = rect;
    }

    this.updateLayout = function (m) {
        var l = m.latLngToPoint(this.location[0], this.location[1]);
        var d1 = jvm.utils.describeArc(l.x, l.y, this.r, 45, 225);
        var d2 = jvm.utils.describeArc(l.x, l.y, this.r, 225, 45);

        this.path1.setAttribute('d', d1);
        this.path2.setAttribute('d', d2);
        
        if (this.text) {
            this.text.setAttribute('x', l.x - (this.rect.width / 2));
            this.text.setAttribute('y', l.y - this.r - (this.rect.height / 2));
        }
    };

    this.updateLayout(map);
};

/*
*   Examples:
*     jvm.utils.createLabel(map, { location: [-4.61, 55.45], text: 'Seychelles' });
*     jvm.utils.createLabel(map, { code: 'SC' });
*     jvm.utils.createLabel(map, { code: 'SC', text: 'custom text' });
*/
jvm.utils.createLabel = function (map, settings) {
    var label = new jvm.utils.Label(map, settings);
    map.overlays[label.id] = label;
    return label;
};

/*
*   Examples:
*     jvm.utils.createArrow(map, { from: [1.3, 103.8], to: [7.35, 134.46], color: 'red' });
*     jvm.utils.createArrow(map, { from: 'SG', to: 'PW', color: 'blue' });
*     jvm.utils.createArrow(map, { from: 'SG', to: 'PW', color: 'blue', text: '20%' });
*   Self-pointing (circular) arrows:
*     jvm.utils.createArrow(map, { location: [100, 100] });
*     jvm.utils.createArrow(map, { location: 'ru', text: 'Russia, 45%' });
*     jvm.utils.createArrow(map, { location: 'UA', text: 'Ukraine, 20%', color: 'blue', stroke: 'blue' });
*/
jvm.utils.createArrow = function (map, settings) {
    if (!map) throw new Error('map not defined.');
    if (!settings) throw new Error('settings not defined.');

    var arrow;
    
    if (settings.location)
        arrow = new jvm.utils.CircularArrow(map, settings);
    else
        arrow = new jvm.utils.Arrow(map, settings);
    
    map.overlays[arrow.id] = arrow;
    return arrow;
};

jvm.utils.countries = {
    "AF": { "name": "Afghanistan", "latlng": [33, 65], "cname": "Kabul", "clatlng": [34.5333, 69.1667] },
    "AL": { "name": "Albania", "latlng": [41, 20], "cname": "Tirana", "clatlng": [41.3260, 19.8160] },
    "DZ": { "name": "Algeria", "latlng": [28, 3], "cname": "Algiers", "clatlng": [36.7667, 3.2167] },
    "AS": { "name": "American Samoa", "latlng": [-14.3333, -170], "cname": "Pago Pago", "clatlng": [-14.2794, -170.7006] },
    "AD": { "name": "Andorra", "latlng": [42.5, 1.6], "cname": "Andorra la Vella", "clatlng": [42.5000, 1.5000] },
    "AO": { "name": "Angola", "latlng": [-12.5, 18.5], "cname": "Luanda", "clatlng": [-8.8383, 13.2344] },
    "AI": { "name": "Anguilla", "latlng": [18.25, -63.1667], "cname": "The Valley", "clatlng": [18.2208, -63.0517] },
    "AQ": { "name": "Antarctica", "latlng": [-90, 0], "cname": "", "clatlng": [] },
    "AG": { "name": "Antigua and Barbuda", "latlng": [17.05, -61.8], "cname": "St. John's", "clatlng": [17.1167, -61.8500] },
    "AR": { "name": "Argentina", "latlng": [-34, -64], "cname": "Buenos Aires", "clatlng": [-34.6033, -58.3817] },
    "AM": { "name": "Armenia", "latlng": [40, 45], "cname": "Yerevan", "clatlng": [40.1833, 44.5167] },
    "AW": { "name": "Aruba", "latlng": [12.5, -69.9667], "cname": "Oranjestad", "clatlng": [12.5190, -70.0370] },
    "AU": { "name": "Australia", "latlng": [-27, 133], "cname": "Canberra", "clatlng": [-35.3075, 149.1244] },
    "AT": { "name": "Austria", "latlng": [47.3333, 13.3333], "cname": "Vienna", "clatlng": [48.2083, 16.3731] },
    "AZ": { "name": "Azerbaijan", "latlng": [40.5, 47.5], "cname": "Baku", "clatlng": [40.3953, 49.8822] },
    "BS": { "name": "Bahamas", "latlng": [24.25, -76], "cname": "Nassau", "clatlng": [25.0600, -77.3450] },
    "BH": { "name": "Bahrain", "latlng": [26, 50.55], "cname": "Manama", "clatlng": [26.2167, 50.5833] },
    "BD": { "name": "Bangladesh", "latlng": [24, 90], "cname": "Dhaka", "clatlng": [23.7000, 90.3750] },
    "BB": { "name": "Barbados", "latlng": [13.1667, -59.5333], "cname": "Bridgetown", "clatlng": [13.1058, -59.6131] },
    "BY": { "name": "Belarus", "latlng": [53, 28], "cname": "Minsk", "clatlng": [53.9000, 27.5667] },
    "BE": { "name": "Belgium", "latlng": [50.8333, 4], "cname": "Brussels", "clatlng": [50.8500, 4.3500] },
    "BZ": { "name": "Belize", "latlng": [17.25, -88.75], "cname": "Belmopan", "clatlng": [17.2514, -88.7669] },
    "BJ": { "name": "Benin", "latlng": [9.5, 2.25], "cname": "Porto-Novo", "clatlng": [6.4972, 2.6050] },
    "BM": { "name": "Bermuda", "latlng": [32.3333, -64.75], "cname": "Hamilton", "clatlng": [32.2930, -64.7820] },
    "BT": { "name": "Bhutan", "latlng": [27.5, 90.5], "cname": "Thimphu", "clatlng": [27.4667, 89.6417] },
    "BO": { "name": "Bolivia", "latlng": [-17, -65], "cname": "Sucre", "clatlng": [-19.2000, -65.2500] },
    "BA": { "name": "Bosnia and Herzegovina", "latlng": [44, 18], "cname": "Sarajevo", "clatlng": [43.8476, 18.3564] },
    "BW": { "name": "Botswana", "latlng": [-22, 24], "cname": "Gaborone", "clatlng": [-24.6581, 25.9122] },
    "BV": { "name": "Bouvet Island", "latlng": [-54.4333, 3.4], "cname": "", "clatlng": [] },
    "BR": { "name": "Brazil", "latlng": [-10, -55], "cname": "Brasilia", "clatlng": [-15.7989, -47.8667] },
    "IO": { "name": "British Indian Ocean Territory", "latlng": [-6, 71.5], "cname": "Road Town", "clatlng": [18.4314, -64.6231] },
    "BN": { "name": "Brunei Darussalam", "latlng": [4.5, 114.6667], "cname": "Bandar Seri Begawan", "clatlng": [4.8903, 114.9422] },
    "BG": { "name": "Bulgaria", "latlng": [43, 25], "cname": "Sofia", "clatlng": [42.7000, 23.3333] },
    "BF": { "name": "Burkina Faso", "latlng": [13, -2], "cname": "Ouagadougou", "clatlng": [12.3572, -1.5353] },
    "BI": { "name": "Burundi", "latlng": [-3.5, 30], "cname": "Bujumbura", "clatlng": [-3.3833, 29.3667] },
    "KH": { "name": "Cambodia", "latlng": [13, 105], "cname": "Phnom Penh", "clatlng": [11.5500, 104.9167] },
    "CM": { "name": "Cameroon", "latlng": [6, 12], "cname": "Yaoundé", "clatlng": [3.8667, 11.5167] },
    "CA": { "name": "Canada", "latlng": [60, -95], "cname": "Ottawa", "clatlng": [45.4214, -75.6919] },
    "CV": { "name": "Cape Verde", "latlng": [16, -24], "cname": "Praia", "clatlng": [14.9208, -23.5083] },
    "KY": { "name": "Cayman Islands", "latlng": [19.5, -80.5], "cname": "George Town", "clatlng": [19.3034, -81.3863] },
    "CF": { "name": "Central African Republic", "latlng": [7, 21], "cname": "Bangui", "clatlng": [4.3667, 18.5833] },
    "TD": { "name": "Chad", "latlng": [15, 19], "cname": "N'Djamena", "clatlng": [12.1131, 15.0492] },
    "CL": { "name": "Chile", "latlng": [-30, -71], "cname": "Santiago", "clatlng": [-33.4500, -70.6667] },
    "CN": { "name": "China", "latlng": [35, 105], "cname": "Beijing", "clatlng": [39.9139, 116.3917] },
    "CX": { "name": "Christmas Island", "latlng": [-10.5, 105.6667], "cname": "Flying Fish Cove", "clatlng": [-10.4217, 105.6781] },
    "CC": { "name": "Cocos (Keeling) Islands", "latlng": [-12.5, 96.8333], "cname": "West Island", "clatlng": [-12.1869, 96.8283] },
    "CO": { "name": "Colombia", "latlng": [4, -72], "cname": "Bogotá", "clatlng": [4.5981, -74.0758] },
    "KM": { "name": "Comoros", "latlng": [-12.1667, 44.25], "cname": "Moroni", "clatlng": [-11.7500, 43.2000] },
    "CG": { "name": "Congo", "latlng": [-1, 15], "cname": "Brazzaville", "clatlng": [-4.2678, 15.2919] },
    "CD": { "name": "Congo, the Democratic Republic of the", "latlng": [0, 25], "cname": "Kinshasa", "clatlng": [-4.3250, 15.3222] },
    "CK": { "name": "Cook Islands", "latlng": [-21.2333, -159.7667], "cname": "Avarua", "clatlng": [-21.2000, -159.7667] },
    "CR": { "name": "Costa Rica", "latlng": [10, -84], "cname": "San Jose", "clatlng": [9.9333, -84.0833] },
    "CI": { "name": "Côte d'Ivoire", "latlng": [8, -5], "cname": "Yamoussoukro", "clatlng": [6.8167, -5.2833] },
    "HR": { "name": "Croatia", "latlng": [45.1667, 15.5], "cname": "Zagreb", "clatlng": [45.8167, 15.9833] },
    "CU": { "name": "Cuba", "latlng": [21.5, -80], "cname": "Havana", "clatlng": [23.1333, -82.3833] },
    "CY": { "name": "Cyprus", "latlng": [35, 33], "cname": "Nicosia", "clatlng": [35.1667, 33.3667] },
    "CZ": { "name": "Czech Republic", "latlng": [49.75, 15.5], "cname": "Prague", "clatlng": [50.0833, 14.4167] },
    "DK": { "name": "Denmark", "latlng": [56, 10], "cname": "Copenhagen", "clatlng": [55.6761, 12.5683] },
    "DJ": { "name": "Djibouti", "latlng": [11.5, 43], "cname": "Djibouti", "clatlng": [11.8000, 42.4333] },
    "DM": { "name": "Dominica", "latlng": [15.4167, -61.3333], "cname": "Roseau", "clatlng": [15.3014, -61.3883] },
    "DO": { "name": "Dominican Republic", "latlng": [19, -70.6667], "cname": "Santo Domingo", "clatlng": [18.4667, -69.9500] },
    "EC": { "name": "Ecuador", "latlng": [-2, -77.5], "cname": "Quito", "clatlng": [-0.2500, -78.5833] },
    "EG": { "name": "Egypt", "latlng": [27, 30], "cname": "Cairo", "clatlng": [30.0500, 31.2333] },
    "SV": { "name": "El Salvador", "latlng": [13.8333, -88.9167], "cname": "San Salvador", "clatlng": [13.6900, -89.1900] },
    "GQ": { "name": "Equatorial Guinea", "latlng": [2, 10], "cname": "Malabo", "clatlng": [3.7500, 8.7833] },
    "ER": { "name": "Eritrea", "latlng": [15, 39], "cname": "Asmara", "clatlng": [15.3333, 38.9333] },
    "EE": { "name": "Estonia", "latlng": [59, 26], "cname": "Tallinn", "clatlng": [59.4372, 24.7453] },
    "ET": { "name": "Ethiopia", "latlng": [8, 38], "cname": "Addis Ababa", "clatlng": [9.0300, 38.7400] },
    "FK": { "name": "Falkland Islands (Malvinas)", "latlng": [-51.75, -59], "cname": "Stanley", "clatlng": [-51.6921, -57.8589] },
    "FO": { "name": "Faroe Islands", "latlng": [62, -7], "cname": "Tórshavn", "clatlng": [62.0117, -6.7675] },
    "FJ": { "name": "Fiji", "latlng": [-18, 175], "cname": "Suva", "clatlng": [-18.1416, 178.4419] },
    "FI": { "name": "Finland", "latlng": [64, 26], "cname": "Helsinki", "clatlng": [60.1708, 24.9375] },
    "FR": { "name": "France", "latlng": [46, 2], "cname": "Paris", "clatlng": [48.8567, 2.3508] },
    "GF": { "name": "French Guiana", "latlng": [4, -53], "cname": "Cayenne", "clatlng": [4.9227, -52.3269] },
    "PF": { "name": "French Polynesia", "latlng": [-15, -140], "cname": "Pape'ete", "clatlng": [-17.5350, -149.5696] },
    "TF": { "name": "French Southern Territories", "latlng": [-43, 67], "cname": "Port-aux-Français", "clatlng": [-49.3500, 70.2167] },
    "GA": { "name": "Gabon", "latlng": [-1, 11.75], "cname": "Libreville", "clatlng": [0.3901, 9.4544] },
    "GM": { "name": "Gambia", "latlng": [13.4667, -16.5667], "cname": "Banjul", "clatlng": [13.4531, -16.5775] },
    "GE": { "name": "Georgia", "latlng": [42, 43.5], "cname": "Tbilisi", "clatlng": [41.7167, 44.7833] },
    "DE": { "name": "Germany", "latlng": [51, 9], "cname": "Berlin", "clatlng": [52.5167, 13.3833] },
    "GH": { "name": "Ghana", "latlng": [8, -2], "cname": "Accra", "clatlng": [5.5500, -0.2000] },
    "GI": { "name": "Gibraltar", "latlng": [36.1833, -5.3667], "cname": "Gibraltar", "clatlng": [36.1430, -5.3530] },
    "GR": { "name": "Greece", "latlng": [39, 22], "cname": "Athens", "clatlng": [37.9667, 23.7167] },
    "GL": { "name": "Greenland", "latlng": [72, -40], "cname": "Nuuk", "clatlng": [64.1750, -51.7389] },
    "GD": { "name": "Grenada", "latlng": [12.1167, -61.6667], "cname": "St. George's", "clatlng": [12.0500, -61.7500] },
    "GP": { "name": "Guadeloupe", "latlng": [16.25, -61.5833], "cname": "Basse-Terre", "clatlng": [15.9958, -61.7292] },
    "GU": { "name": "Guam", "latlng": [13.4667, 144.7833], "cname": "Hagåtña", "clatlng": [13.4833, 144.7500] },
    "GT": { "name": "Guatemala", "latlng": [15.5, -90.25], "cname": "Guatemala", "clatlng": [14.6133, -90.5353] },
    "GG": { "name": "Guernsey", "latlng": [49.5, -2.56], "cname": "St. Peter Port", "clatlng": [49.4555, -2.5368] },
    "GN": { "name": "Guinea", "latlng": [11, -10], "cname": "Conakry", "clatlng": [9.5092, -13.7122] },
    "GW": { "name": "Guinea-Bissau", "latlng": [12, -15], "cname": "Bissau", "clatlng": [11.8500, -15.5667] },
    "GY": { "name": "Guyana", "latlng": [5, -59], "cname": "Georgetown", "clatlng": [6.8000, -58.1667] },
    "HT": { "name": "Haiti", "latlng": [19, -72.4167], "cname": "Port-au-Prince", "clatlng": [18.5333, -72.3333] },
    "HM": { "name": "Heard Island and McDonald Islands", "latlng": [-53.1, 72.5167], "cname": "", "clatlng": [] },
    "VA": { "name": "Holy See (Vatican City State)", "latlng": [41.9, 12.45], "cname": "Vatican City", "clatlng": [41.9040, 12.4530] },
    "HN": { "name": "Honduras", "latlng": [15, -86.5], "cname": "Tegucigalpa", "clatlng": [14.0833, -87.2167] },
    "HK": { "name": "Hong Kong", "latlng": [22.25, 114.1667], "cname": "Hong Kong", "clatlng": [22.2783, 114.1589] },
    "HU": { "name": "Hungary", "latlng": [47, 20], "cname": "Budapest", "clatlng": [47.4719, 19.0503] },
    "IS": { "name": "Iceland", "latlng": [65, -18], "cname": "Reykjavik", "clatlng": [64.1333, -21.9333] },
    "IN": { "name": "India", "latlng": [20, 77], "cname": "New Delhi", "clatlng": [28.6139, 77.2089] },
    "ID": { "name": "Indonesia", "latlng": [-5, 120], "cname": "Jakarta", "clatlng": [-6.2000, 106.8000] },
    "IR": { "name": "Iran, Islamic Republic of", "latlng": [32, 53], "cname": "Tehran", "clatlng": [35.6961, 51.4231] },
    "IQ": { "name": "Iraq", "latlng": [33, 44], "cname": "Baghdad", "clatlng": [33.3250, 44.4220] },
    "IE": { "name": "Ireland", "latlng": [53, -8], "cname": "Dublin", "clatlng": [53.3478, -6.2597] },
    "IM": { "name": "Isle of Man", "latlng": [54.23, -4.55], "cname": "Douglas", "clatlng": [54.1452, -4.4817] },
    "IL": { "name": "Israel", "latlng": [31.5, 34.75], "cname": "Jerusalem", "clatlng": [31.7833, 35.2167] },
    "IT": { "name": "Italy", "latlng": [42.8333, 12.8333], "cname": "Rome", "clatlng": [41.9000, 12.5000] },
    "JM": { "name": "Jamaica", "latlng": [18.25, -77.5], "cname": "Kingston", "clatlng": [17.9833, -76.8000] },
    "JP": { "name": "Japan", "latlng": [36, 138], "cname": "Tokyo", "clatlng": [35.6895, 139.6917] },
    "JE": { "name": "Jersey", "latlng": [49.21, -2.13], "cname": "Saint Helier", "clatlng": [49.1870, -2.1070] },
    "JO": { "name": "Jordan", "latlng": [31, 36], "cname": "Amman", "clatlng": [31.9333, 35.9333] },
    "KZ": { "name": "Kazakhstan", "latlng": [48, 68], "cname": "Astana", "clatlng": [51.1806, 71.4611] },
    "KE": { "name": "Kenya", "latlng": [1, 38], "cname": "Nairobi", "clatlng": [-1.2833, 36.8167] },
    "KI": { "name": "Kiribati", "latlng": [1.4167, 173], "cname": "Tarawa", "clatlng": [1.4167, 173.0333] },
    "KP": { "name": "Korea, Democratic People's Republic of", "latlng": [40, 127], "cname": "P'yongyang", "clatlng": [39.0194, 125.7381] },
    "KR": { "name": "Korea, Republic of", "latlng": [37, 127.5], "cname": "Seoul", "clatlng": [37.5665, 126.9780] },
    "KW": { "name": "Kuwait", "latlng": [29.3375, 47.6581], "cname": "Kuwait", "clatlng": [29.3697, 47.9783] },
    "KG": { "name": "Kyrgyzstan", "latlng": [41, 75], "cname": "Bishkek", "clatlng": [42.8747, 74.6122] },
    "LA": { "name": "Lao People's Democratic Republic", "latlng": [18, 105], "cname": "Vientiane", "clatlng": [17.9667, 102.6000] },
    "LV": { "name": "Latvia", "latlng": [57, 25], "cname": "Riga", "clatlng": [56.9489, 24.1064] },
    "LB": { "name": "Lebanon", "latlng": [33.8333, 35.8333], "cname": "Beirut", "clatlng": [33.8869, 35.5131] },
    "LS": { "name": "Lesotho", "latlng": [-29.5, 28.5], "cname": "Maseru", "clatlng": [-29.3100, 27.4800] },
    "LR": { "name": "Liberia", "latlng": [6.5, -9.5], "cname": "Monrovia", "clatlng": [6.3133, -10.8014] },
    "LY": { "name": "Libyan Arab Jamahiriya", "latlng": [25, 17], "cname": "Tripoli", "clatlng": [32.9022, 13.1858] },
    "LI": { "name": "Liechtenstein", "latlng": [47.1667, 9.5333], "cname": "Vaduz", "clatlng": [47.1410, 9.5210] },
    "LT": { "name": "Lithuania", "latlng": [56, 24], "cname": "Vilnius", "clatlng": [54.6833, 25.2833] },
    "LU": { "name": "Luxembourg", "latlng": [49.75, 6.1667], "cname": "Luxembourg", "clatlng": [49.6117, 6.1300] },
    "MO": { "name": "Macao", "latlng": [22.1667, 113.55], "cname": "Macau", "clatlng": [22.1667, 113.5500] },
    "MK": { "name": "Macedonia, the former Yugoslav Republic of", "latlng": [41.8333, 22], "cname": "Skopje", "clatlng": [42.0000, 21.4333] },
    "MG": { "name": "Madagascar", "latlng": [-20, 47], "cname": "Antananarivo", "clatlng": [-18.9333, 47.5167] },
    "MW": { "name": "Malawi", "latlng": [-13.5, 34], "cname": "Lilongwe", "clatlng": [-13.9833, 33.7833] },
    "MY": { "name": "Malaysia", "latlng": [2.5, 112.5], "cname": "Kuala Lumpur", "clatlng": [3.1357, 101.6880] },
    "MV": { "name": "Maldives", "latlng": [3.25, 73], "cname": "Malé", "clatlng": [4.1753, 73.5089] },
    "ML": { "name": "Mali", "latlng": [17, -4], "cname": "Bamako", "clatlng": [12.6500, -8.0000] },
    "MT": { "name": "Malta", "latlng": [35.8333, 14.5833], "cname": "Valletta", "clatlng": [35.8978, 14.5125] },
    "MH": { "name": "Marshall Islands", "latlng": [9, 168], "cname": "Majuro", "clatlng": [7.0667, 171.2667] },
    "MQ": { "name": "Martinique", "latlng": [14.6667, -61], "cname": "Fort-de-France", "clatlng": [14.6000, -61.0833] },
    "MR": { "name": "Mauritania", "latlng": [20, -12], "cname": "Nouakchott", "clatlng": [18.1000, -15.9500] },
    "MU": { "name": "Mauritius", "latlng": [-20.2833, 57.55], "cname": "Port Louis", "clatlng": [-20.1644, 57.5041] },
    "YT": { "name": "Mayotte", "latlng": [-12.8333, 45.1667], "cname": "Mamoudzou", "clatlng": [-12.7806, 45.2278] },
    "MX": { "name": "Mexico", "latlng": [23, -102], "cname": "Mexico", "clatlng": [19.4328, -99.1333] },
    "FM": { "name": "Micronesia, Federated States of", "latlng": [6.9167, 158.25], "cname": "Palikir", "clatlng": [6.9172, 158.1589] },
    "MD": { "name": "Moldova, Republic of", "latlng": [47, 29], "cname": "Chișinău", "clatlng": [47.0107, 28.8687] },
    "MC": { "name": "Monaco", "latlng": [43.7333, 7.4], "cname": "Monaco", "clatlng": [43.43, 7.25] },
    "MN": { "name": "Mongolia", "latlng": [46, 105], "cname": "Ulan Bator", "clatlng": [47.9200, 106.9200] },
    "ME": { "name": "Montenegro", "latlng": [42, 19], "cname": "Podgorica", "clatlng": [42.4410, 19.2628] },
    "MS": { "name": "Montserrat", "latlng": [16.75, -62.2], "cname": "Plymouth", "clatlng": [16.7064, -62.2158] },
    "MA": { "name": "Morocco", "latlng": [32, -5], "cname": "Rabat", "clatlng": [34.0209, -6.8416] },
    "MZ": { "name": "Mozambique", "latlng": [-18.25, 35], "cname": "Maputo", "clatlng": [-25.9667, 32.5833] },
    "MM": { "name": "Myanmar", "latlng": [22, 98], "cname": "Yangon", "clatlng": [16.8000, 96.1500] },
    "NA": { "name": "Namibia", "latlng": [-22, 17], "cname": "Windhoek", "clatlng": [-22.5700, 17.0836] },
    "NR": { "name": "Nauru", "latlng": [-0.5333, 166.9167], "cname": "Yaren District", "clatlng": [-0.5477, 166.9209] },
    "NP": { "name": "Nepal", "latlng": [28, 84], "cname": "Kathmandu", "clatlng": [27.7000, 85.3333] },
    "NL": { "name": "Netherlands", "latlng": [52.5, 5.75], "cname": "Hague", "clatlng": [52.3731, 4.8922] },
    "AN": { "name": "Netherlands Antilles", "latlng": [12.25, -68.75], "cname": "Willemstad", "clatlng": [12.1167, -68.9333] },
    "NC": { "name": "New Caledonia", "latlng": [-21.5, 165.5], "cname": "Noumea", "clatlng": [-22.2758, 166.4580] },
    "NZ": { "name": "New Zealand", "latlng": [-41, 174], "cname": "Wellington", "clatlng": [-41.2889, 174.7772] },
    "NI": { "name": "Nicaragua", "latlng": [13, -85], "cname": "Managua", "clatlng": [12.1364, -86.2514] },
    "NE": { "name": "Niger", "latlng": [16, 8], "cname": "Niamey", "clatlng": [13.5214, 2.1053] },
    "NG": { "name": "Nigeria", "latlng": [10, 8], "cname": "Abuja", "clatlng": [9.0667, 7.4833] },
    "NU": { "name": "Niue", "latlng": [-19.0333, -169.8667], "cname": "Alofi", "clatlng": [-19.0589, -169.8754] },
    "NF": { "name": "Norfolk Island", "latlng": [-29.0333, 167.95], "cname": "Kingston", "clatlng": [-29.0500, 167.9667] },
    "MP": { "name": "Northern Mariana Islands", "latlng": [15.2, 145.75], "cname": "Saipan", "clatlng": [15.1833, 145.7500] },
    "NO": { "name": "Norway", "latlng": [62, 10], "cname": "Oslo", "clatlng": [59.9500, 10.7500] },
    "OM": { "name": "Oman", "latlng": [21, 57], "cname": "Masqat", "clatlng": [23.6100, 58.5400] },
    "PK": { "name": "Pakistan", "latlng": [30, 70], "cname": "Islamabad", "clatlng": [33.7167, 73.0667] },
    "PW": { "name": "Palau", "latlng": [7.5, 134.5], "cname": "Koror", "clatlng": [7.3606, 134.4792] },
    "PS": { "name": "Palestinian Territory, Occupied", "latlng": [32, 35.25], "cname": "", "clatlng": [] },
    "PA": { "name": "Panama", "latlng": [9, -80], "cname": "Panama", "clatlng": [8.9833, -79.5167] },
    "PG": { "name": "Papua New Guinea", "latlng": [-6, 147], "cname": "Port Moresby", "clatlng": [-9.5136, 147.2188] },
    "PY": { "name": "Paraguay", "latlng": [-23, -58], "cname": "Asuncion", "clatlng": [-25.2822, -57.6351] },
    "PE": { "name": "Peru", "latlng": [-10, -76], "cname": "Lima", "clatlng": [-12.0433, -77.0283] },
    "PH": { "name": "Philippines", "latlng": [13, 122], "cname": "Manila", "clatlng": [14.5833, 120.9667] },
    "PN": { "name": "Pitcairn", "latlng": [-24.7, -127.4], "cname": "Adamstown", "clatlng": [-25.0667, -130.1000] },
    "PL": { "name": "Poland", "latlng": [52, 20], "cname": "Warsaw", "clatlng": [52.2333, 21.0167] },
    "PT": { "name": "Portugal", "latlng": [39.5, -8], "cname": "Lisbon", "clatlng": [38.7138, -9.1394] },
    "PR": { "name": "Puerto Rico", "latlng": [18.25, -66.5], "cname": "San Juan", "clatlng": [18.4500, -66.0667] },
    "QA": { "name": "Qatar", "latlng": [25.5, 51.25], "cname": "Doha", "clatlng": [25.2867, 51.5333] },
    "RE": { "name": "Réunion", "latlng": [-21.1, 55.6], "cname": "Saint-Denis", "clatlng": [-20.8789, 55.4481] },
    "RO": { "name": "Romania", "latlng": [46, 25], "cname": "Bucuresti", "clatlng": [44.4325, 26.1039] },
    "RU": { "name": "Russian Federation", "latlng": [60, 100], "cname": "Moscow", "clatlng": [55.7500, 37.6167] },
    "RW": { "name": "Rwanda", "latlng": [-2, 30], "cname": "Kigali", "clatlng": [-1.9439, 30.0594] },
    "SH": { "name": "Saint Helena, Ascension and Tristan da Cunha", "latlng": [-15.9333, -5.7], "cname": "Jamestown", "clatlng": [-15.9244, 5.7181] },
    "KN": { "name": "Saint Kitts and Nevis", "latlng": [17.3333, -62.75], "cname": "Basseterre", "clatlng": [17.3000, -62.7333] },
    "LC": { "name": "Saint Lucia", "latlng": [13.8833, -61.1333], "cname": "Castries", "clatlng": [14.0167, -60.9833] },
    "PM": { "name": "Saint Pierre and Miquelon", "latlng": [46.8333, -56.3333], "cname": "Saint-Pierre", "clatlng": [46.7878, -56.1968] },
    "VC": { "name": "Saint Vincent and the Grenadines", "latlng": [13.25, -61.2], "cname": "Kingstown", "clatlng": [13.1578, -61.2250] },
    "WS": { "name": "Samoa", "latlng": [-13.5833, -172.3333], "cname": "Apia", "clatlng": [-13.8333, -171.7500] },
    "SM": { "name": "San Marino", "latlng": [43.7667, 12.4167], "cname": "San Marino", "clatlng": [43.9346, 12.4473] },
    "ST": { "name": "Sao Tome and Principe", "latlng": [1, 7], "cname": "São Tomé", "clatlng": [0.3361, 6.6814] },
    "SA": { "name": "Saudi Arabia", "latlng": [25, 45], "cname": "Riyadh", "clatlng": [24.6333, 46.7167] },
    "SN": { "name": "Senegal", "latlng": [14, -14], "cname": "Dakar", "clatlng": [14.6928, -17.4467] },
    "RS": { "name": "Serbia", "latlng": [44, 21], "cname": "Belgrade", "clatlng": [44.8167, 20.4667] },
    "SC": { "name": "Seychelles", "latlng": [-4.5833, 55.6667], "cname": "Victoria", "clatlng": [-4.6167, 55.4500] },
    "SL": { "name": "Sierra Leone", "latlng": [8.5, -11.5], "cname": "Freetown", "clatlng": [8.4844, -13.2344] },
    "SG": { "name": "Singapore", "latlng": [1.3667, 103.8], "cname": "Singapore", "clatlng": [1.7, 103.50] },
    "SK": { "name": "Slovakia", "latlng": [48.6667, 19.5], "cname": "Bratislava", "clatlng": [48.1439, 17.1097] },
    "SI": { "name": "Slovenia", "latlng": [46, 15], "cname": "Ljubljana", "clatlng": [46.0556, 14.5083] },
    "SB": { "name": "Solomon Islands", "latlng": [-8, 159], "cname": "Honiara", "clatlng": [-9.4667, 159.8167] },
    "SO": { "name": "Somalia", "latlng": [10, 49], "cname": "Mogadishu", "clatlng": [2.0333, 45.3500] },
    "ZA": { "name": "South Africa", "latlng": [-29, 24], "cname": "Pretoria", "clatlng": [-25.7461, 28.1881] },
    "GS": { "name": "South Georgia and the South Sandwich Islands", "latlng": [-54.5, -37], "cname": "King Edward Point", "clatlng": [-54.2833, -36.5000] },
    "ES": { "name": "Spain", "latlng": [40, -4], "cname": "Madrid", "clatlng": [40.4000, -3.6833] },
    "LK": { "name": "Sri Lanka", "latlng": [7, 81], "cname": "Sri Jayawardenepura Kotte", "clatlng": [6.9108, 79.8878] },
    "SD": { "name": "Sudan", "latlng": [15, 30], "cname": "Khartoum", "clatlng": [15.6333, 32.5333] },
    "SR": { "name": "Suriname", "latlng": [4, -56], "cname": "Paramaribo", "clatlng": [5.8667, -55.1667] },
    "SJ": { "name": "Svalbard and Jan Mayen", "latlng": [78, 20], "cname": "Longyearbyen", "clatlng": [78.2200, 15.6500] },
    "SZ": { "name": "Swaziland", "latlng": [-26.5, 31.5], "cname": "Mbabane", "clatlng": [-26.3167, 31.1333] },
    "SE": { "name": "Sweden", "latlng": [62, 15], "cname": "Stockholm", "clatlng": [59.3294, 18.0686] },
    "CH": { "name": "Switzerland", "latlng": [47, 8], "cname": "Bern", "clatlng": [46.9500, 7.4500] },
    "SY": { "name": "Syrian Arab Republic", "latlng": [35, 38], "cname": "Damascus", "clatlng": [33.5130, 36.2920] },
    "TW": { "name": "Taiwan, Province of China", "latlng": [23.5, 121], "cname": "Taipei", "clatlng": [25.0333, 121.6333] },
    "TJ": { "name": "Tajikistan", "latlng": [39, 71], "cname": "Dushanbe", "clatlng": [38.5367, 68.7800] },
    "TZ": { "name": "Tanzania, United Republic of", "latlng": [-6, 35], "cname": "Dodoma", "clatlng": [-6.1731, 35.7419] },
    "TH": { "name": "Thailand", "latlng": [15, 100], "cname": "Bangkok", "clatlng": [13.7500, 100.4667] },
    "TL": { "name": "Timor-Leste", "latlng": [-8.55, 125.5167], "cname": "Dili", "clatlng": [-8.5500, 125.5833] },
    "TG": { "name": "Togo", "latlng": [8, 1.1667], "cname": "Lome", "clatlng": [6.1378, 1.2125] },
    "TK": { "name": "Tokelau", "latlng": [-9, -172], "cname": "Nukunonu", "clatlng": [-9.1683, -171.8097] },
    "TO": { "name": "Tonga", "latlng": [-20, -175], "cname": "Nuku'alofa", "clatlng": [-21.1333, -175.2000] },
    "TT": { "name": "Trinidad and Tobago", "latlng": [11, -61], "cname": "Port of Spain", "clatlng": [10.6667, -61.5167] },
    "TN": { "name": "Tunisia", "latlng": [34, 9], "cname": "Tunis", "clatlng": [36.8000, 10.1833] },
    "TR": { "name": "Turkey", "latlng": [39, 35], "cname": "Ankara", "clatlng": [39.8750, 32.8333] },
    "TM": { "name": "Turkmenistan", "latlng": [40, 60], "cname": "Ashgabat", "clatlng": [37.9333, 58.3667] },
    "TC": { "name": "Turks and Caicos Islands", "latlng": [21.75, -71.5833], "cname": "Cockburn Town", "clatlng": [21.4590, -71.1390] },
    "TV": { "name": "Tuvalu", "latlng": [-8, 178], "cname": "Funafuti", "clatlng": [-8.5167, 179.2167] },
    "UG": { "name": "Uganda", "latlng": [1, 32], "cname": "Kampala", "clatlng": [0.3136, 32.5811] },
    "UA": { "name": "Ukraine", "latlng": [49, 32], "cname": "Kiev", "clatlng": [50.4500, 30.5233] },
    "AE": { "name": "United Arab Emirates", "latlng": [24, 54], "cname": "Abu Dhabi", "clatlng": [24.4667, 54.3667] },
    "GB": { "name": "United Kingdom", "latlng": [54, -2], "cname": "London", "clatlng": [51.5072, -0.1275] },
    "US": { "name": "United States", "latlng": [38, -97], "cname": "Washington DC", "clatlng": [38.8951, -77.0367] },
    "UM": { "name": "United States Minor Outlying Islands", "latlng": [19.2833, 166.6], "cname": "Washington, D.C", "clatlng": [38.8951, -77.0367] },
    "UY": { "name": "Uruguay", "latlng": [-33, -56], "cname": "Montevideo", "clatlng": [-34.8836, -56.1819] },
    "UZ": { "name": "Uzbekistan", "latlng": [41, 64], "cname": "Tashkent", "clatlng": [41.2667, 69.2167] },
    "VU": { "name": "Vanuatu", "latlng": [-16, 167], "cname": "Port-Vila", "clatlng": [-17.7500, 168.3000] },
    "VE": { "name": "Venezuela, Bolivarian Republic of", "latlng": [8, -66], "cname": "Caracas", "clatlng": [10.5000, -66.9167] },
    "VN": { "name": "Viet Nam", "latlng": [16, 106], "cname": "Hanoi", "clatlng": [21.0333, 105.8500] },
    "VG": { "name": "Virgin Islands, British", "latlng": [18.5, -64.5], "cname": "Road Town", "clatlng": [18.4314, -64.6231] },
    "VI": { "name": "Virgin Islands, U.S.", "latlng": [18.3333, -64.8333], "cname": "Charlotte Amalie", "clatlng": [18.3500, -64.9500] },
    "WF": { "name": "Wallis and Futuna", "latlng": [-13.3, -176.2], "cname": "Mata-Utu", "clatlng": [-13.2833, -176.1833] },
    "EH": { "name": "Western Sahara", "latlng": [24.5, -13], "cname": "El Aaiún", "clatlng": [27.1536, -13.2033] },
    "YE": { "name": "Yemen", "latlng": [15, 48], "cname": "Sana'a", "clatlng": [15.3483, 44.2064] },
    "ZM": { "name": "Zambia", "latlng": [-15, 30], "cname": "Lusaka", "clatlng": [-15.4167, 28.2833] },
    "ZW": { "name": "Zimbabwe", "latlng": [-20, 30], "cname": "Harare", "clatlng": [-17.8639, 31.0297] }
};
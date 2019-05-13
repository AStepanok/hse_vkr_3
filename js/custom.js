let Y_map;
let Y_addressInput;
const Y_geoObjects = {};

let geoObjectsCounter = 0;
const addressInput = $('#address-input');
const addressesList = $('.list');

ymaps.ready(init);

function init() {
    Y_map = new ymaps.Map('map', {
        center: [55.76, 37.64],
        zoom: 10
    });
    Y_addressInput = new ymaps.SuggestView('address-input');
}

function findPlace(place) {
    let myGeocoder = ymaps.geocode(place);
    myGeocoder.then(function(res) {
        console.log(res);
        const geoObject = res.geoObjects.get(0),
            bounds = geoObject.properties.get('boundedBy');

        geoObject.options.set('preset', 'islands#darkBlueDotIconWithCaption');
        geoObject.properties.set('iconCaption', geoObject.getAddressLine());

        if (!Y_geoObjects[place]) {
            Y_map.geoObjects.add(geoObject);
            Y_map.setBounds(bounds, {
                checkZoomRange: true
            });

            console.log(Y_geoObjects);
            Y_geoObjects[place] = geoObject;
            console.log(Y_geoObjects);
            addressesList.append(`<li class="geoObject" y_id="${place}">${place}</li>`);
            geoObjectsCounter++;
        }
    });
}

addressInput.on('keypress', function (e) {
    if (e.which === 13) {
        findPlace($(this).val());
    }
});

addressesList.on('click', '.geoObject', function () {
   const id = $(this).attr('y_id');
   Y_map.geoObjects.remove(Y_geoObjects[id]);
   Y_geoObjects[id] = undefined;
   $(this).remove();
});



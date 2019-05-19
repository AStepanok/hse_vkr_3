let Y_map;
let Y_addressInput;
const Y_geoObjects = {};

let geoObjectsCounter = 0;
let lastRoute;
const addressInput = $('#address-input');
const addressesList = $('.list');
const routeButton = $('#route');

ymaps.ready(init);

function init() {
    Y_map = new ymaps.Map('map', {
        center: [55.76, 37.64],
        zoom: 10,
        controls: ['zoomControl'],
    });
    Y_addressInput = new ymaps.SuggestView('address-input', {
        provider: 'yandex#map'
    });
    Y_addressInput.events.add('select', function (e) {
        findPlace(addressInput.val());
        addressInput.val('');
    })
}

function findPlace(place) {
    let myGeocoder = ymaps.geocode(place);
    myGeocoder.then(function(res) {
        const geoObject = res.geoObjects.get(0),
            bounds = geoObject.properties.get('boundedBy');

        geoObject.options.set('preset', 'islands#darkBlueDotIconWithCaption');
        geoObject.properties.set('iconCaption', geoObject.getAddressLine());

        if (!Y_geoObjects[place]) {
            Y_map.geoObjects.add(geoObject);
            Y_map.setBounds(bounds, {
                checkZoomRange: true
            });

            geoObjectsCounter++;
            Y_geoObjects[place] = {
                object: geoObject,
                priority: geoObjectsCounter
            };
            rerenderList();
        }
    });
}

function rerenderList() {
    addressesList.empty();
    Object.keys(Y_geoObjects).map((key) => {
        let options = ``;
        for(let i=1; i <= Object.keys(Y_geoObjects).length; i++) {
            options += `<option ${i === Y_geoObjects[key].priority && 'selected="selected"'}">${i}</option>`;
        }
        addressesList.append(
            `<li class="geoObject" y_id="${key}">
                <div>
                    <h5 class="name">${key}</h5>
                    <div class="select-wrapper">
                        <label>Приоритет:</label>
                        <select class="priority" y_priority="${Y_geoObjects[key].priority}">${options}</select>
                    </div>
                </div>
                <button class="delete">X</button>
            </li>`);
    });
}

addressInput.on('keypress', function (e) {
    if (e.which === 13) {
        findPlace($(this).val());
        $(this).val('');
    }
});

addressesList.on('click', '.delete', function () {
   const id = $(this).parent().attr('y_id');
   Y_map.geoObjects.remove(Y_geoObjects[id].object);
   if (Y_geoObjects[id].priority < Object.keys(Y_geoObjects).length) {
       Object.keys(Y_geoObjects).map((key) => {
           if (Y_geoObjects[key].priority > Y_geoObjects[id].priority)
               Y_geoObjects[key].priority--;
       })
   }
   delete Y_geoObjects[id];
   geoObjectsCounter--;
   rerenderList();
});

addressesList.on('change', '.priority', function (e) {
   const newPriority =$(this).val();
   const oldPriority = $(this).attr('y_priority');
   const id = $(this).parent().parent().parent().attr('y_id');

    Object.keys(Y_geoObjects).map((key) => {
        if (key === id) {
            Y_geoObjects[key].priority = parseInt(newPriority, 10);
            $(this).attr('y_priority', newPriority);
        } else if (Y_geoObjects[key].priority === parseInt(newPriority, 10)) {
            Y_geoObjects[key].priority = parseInt(oldPriority, 10);
            $(`.geoObject[y_id="${key}"] select`).attr('y_priority', oldPriority);
        }
    })

    rerenderList();
});

routeButton.on('click', function () {
    const routedList = algorithm();
    var multiRoute = new ymaps.multiRouter.MultiRoute({
        // Описание опорных точек мультимаршрута.
        referencePoints: routedList,
        // Параметры маршрутизации.
        params: {
            // Ограничение на максимальное количество маршрутов, возвращаемое маршрутизатором.
            results: 20
        }
    }, {
        // Автоматически устанавливать границы карты так, чтобы маршрут был виден целиком.
        boundsAutoApply: true
    });
    Y_map.geoObjects.remove(lastRoute);
    Y_map.geoObjects.add(multiRoute);
    lastRoute = multiRoute;
});

function algorithm() {
    const algObj = {
        visited: {},
        points: {}
    };

    const keys = Object.keys(Y_geoObjects);
    keys.map((keyX) => {
        keys.map((keyY) => {
            if (keyX !== keyY) {
                const distanceFromXToY =
                    ymaps.coordSystem.geo.getDistance(Y_geoObjects[keyX].object.geometry._coordinates,
                        Y_geoObjects[keyY].object.geometry._coordinates) / 1000
                    + (2 ** Y_geoObjects[keyY].priority);
                algObj.points[keyX] = {
                    ...algObj.points[keyX],
                    [keyY]: distanceFromXToY
                };
            }
        })
    });

    let routedList = [];
    let currentPoint;

    keys.map(key => {
        if (Y_geoObjects[key].priority === 1) {
            routedList.push(Y_geoObjects[key].object);
            algObj.visited[key] = true;
            currentPoint = key;
        }
    });

    while(Object.keys(algObj.visited).length < keys.length) {
        let nextPoint;
        let minDistance = Infinity;
        Object.keys(algObj.points[currentPoint]).map((key) => {
            if (minDistance > algObj.points[currentPoint][key] && !Object.keys(algObj.visited).includes(key)) {
                minDistance = algObj.points[currentPoint][key];
                nextPoint = key;
            }
        });
        routedList.push(Y_geoObjects[nextPoint].object);
        algObj.visited[nextPoint] = true;
        currentPoint = nextPoint;
    }

    console.log(algObj);

    return routedList;
}



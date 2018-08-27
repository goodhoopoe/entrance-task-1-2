import { loadList, loadDetails } from './api';
import { getDetailsContentLayout } from './details';
import { createFilterControl } from './filter';

export default function initMap(ymaps, containerId) {
  const myMap = new ymaps.Map(containerId, {
    center: [55.76, 37.64],
    controls: [],
    zoom: 10
  });

  const objectManager = new ymaps.ObjectManager({
    clusterize: true,
    gridSize: 64,
    clusterIconLayout: 'default#pieChart',
    clusterDisableClickZoom: false,
    geoObjectOpenBalloonOnClick: false,
    geoObjectHideIconOnBalloonOpen: false,
    geoObjectBalloonContentLayout: getDetailsContentLayout(ymaps)
  });
  myMap.geoObjects.add(objectManager);

  objectManager.clusters.options.set('preset', 'islands#greenClusterIcons');

  loadList().then(data => {
    objectManager.add(data);
  });

  objectManager.clusters.events.add(['add','remove'], () => {
      objectManager.clusters.each((c) => {
          if (c.features.some((f)=> f.isActive === false)) {
              objectManager.clusters.setClusterOptions(c.id, {
                  preset: 'islands#yellowClusterIcons'
              });
          }
      })
  });
  // details
  objectManager.objects.events.add('click', event => {
    const objectId = event.get('objectId');
    let obj = objectManager.objects.getById(objectId);
    console.log(obj);
    objectManager.objects.balloon.open(objectId);

    if (!obj.properties.details) {
      loadDetails(objectId).then(data => {
        obj.properties.details = data;
        objectManager.objects.balloon.setData(obj);
      });
    }
  });

  // filters
  const listBoxControl = createFilterControl(ymaps);
  myMap.controls.add(listBoxControl);

  const filterMonitor = new ymaps.Monitor(listBoxControl.state);
  filterMonitor.add('filters', filters => {
    objectManager.setFilter(
      obj => filters[obj.isActive ? 'active' : 'defective']
    );
  });
}

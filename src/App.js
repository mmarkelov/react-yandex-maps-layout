import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import ReactDOMServer from 'react-dom/server';
import { YMaps, Map, Clusterer, Placemark } from 'react-yandex-maps';

import POINTS from './points';

import InnerLayout from './InnerLayout';
import './App.css';

const mapState = {
  center: [55.751574, 37.573856],
  zoom: 5,
};

const App = () => {
  const [ymaps, setYmaps] = useState(null);
  const [openedDescription, openDescription] = useState(null);
  const [clusterBalloon, setClusterBalloon] = useState(null);

  const getLayout = (Component, props) => {
    if (ymaps) {
      const html = ReactDOMServer.renderToString(<Component {...props} />);
      const Layout = ymaps.templateLayoutFactory.createClass(
        `<div id="balloon">${html}</div>`,
        {
          build: function() {
            Layout.superclass.build.call(this);
            ReactDOM.hydrate(
              <Component {...props} />,
              document.getElementById('balloon'),
            );
          },
        },
      );

      return Layout;
    }
    return null;
  };

  const animatedLayout = () => {
    if (ymaps) {
      const animatedLayout = ymaps.templateLayoutFactory.createClass(
        '<div class="placemark"></div>',
        {
          build() {
            animatedLayout.superclass.build.call(this);
            const element = this.getParentElement().getElementsByClassName(
              'placemark',
            )[0];
            // Если метка выбрана, то увеличим её размер.
            const size = this.isActive ? 60 : 34;
            // При задании для метки своего HTML макета, фигуру активной области
            // необходимо задать самостоятельно - иначе метка будет неинтерактивной.
            // Создадим фигуру активной области "Круг".
            const smallShape = {
              type: 'Circle',
              coordinates: [0, 0],
              radius: size / 2,
            };
            const bigShape = {
              type: 'Circle',
              coordinates: [0, -30],
              radius: size / 2,
            };
            // Зададим фигуру активной области.
            this.getData().options.set(
              'shape',
              this.isActive ? bigShape : smallShape,
            );
            // Если метка выбрана, то зададим класс и запустим анимацию.
            if (this.isActive) {
              element.classList.add('active');
              element.style.animation = '.35s show-big-placemark';
            } else if (this.inited) {
              element.classList.remove('active');
              element.style.animation = '.35s show-small-placemark';
            }
            if (!this.inited) {
              this.inited = true;
              this.isActive = false;
              // При клике по метке будем перестраивать макет.
              this.getData().geoObject.events.add(
                'click',
                function() {
                  this.isActive = !this.isActive;
                  this.rebuild();
                },
                this,
              );
            }
          },
        },
      );

      return animatedLayout;
    }
    return null;
  };

  useEffect(() => {
    if (document.getElementById('balloon') && clusterBalloon) {
      ReactDOM.hydrate(
        <InnerLayout
          openDescription={openDescription}
          openedDescription={openedDescription}
          {...clusterBalloon}
        />,
        document.getElementById('balloon'),
      );
    }
  }, [clusterBalloon, openedDescription]);

  const openCluster = e => {
    const cluster = e.get('cluster');
    if (cluster) {
      if (!clusterBalloon) {
        setClusterBalloon(
          cluster.state.get('activeObject').properties.getAll(),
        );
      }

      cluster.state.events.add('change', () => {
        const activeObject = cluster.state.get('activeObject');

        if (
          !clusterBalloon ||
          (clusterBalloon &&
            activeObject.properties.getAll().index !== clusterBalloon.index)
        ) {
          setClusterBalloon(activeObject.properties.getAll());
        }
      });
    }
  };

  const closeDescription = () => {
    setClusterBalloon(null);
    openDescription(null);
  };

  return (
    <div className="App">
      <h1>templateLayoutFactory with React</h1>
      <YMaps>
        <Map
          width={640}
          height={480}
          onLoad={ymaps => setYmaps(ymaps)}
          defaultState={mapState}
          modules={[
            'templateLayoutFactory',
            'geoObject.addon.balloon',
            'clusterer.addon.balloon',
          ]}
        >
          <Clusterer
            options={{
              preset: 'islands#invertedVioletClusterIcons',
              groupByCoordinates: false,
              balloonPanelMaxMapArea: Infinity,
              clusterBalloonItemContentLayout: getLayout(InnerLayout, {
                openedDescription,
                openDescription,
                ...clusterBalloon,
              }),
            }}
            onBalloonOpen={openCluster}
            onBalloonClose={closeDescription}
          >
            {POINTS.map((point, index) => (
              <Placemark
                key={index}
                geometry={point.coords}
                properties={{
                  balloonContentHeader: point.title,
                  point,
                  index,
                }}
                options={{
                  iconLayout: animatedLayout(),
                  balloonContentLayout: getLayout(InnerLayout, {
                    point,
                    index,
                    openedDescription,
                    openDescription,
                  }),
                  balloonPanelMaxMapArea: Infinity,
                }}
              />
            ))}
          </Clusterer>
        </Map>
      </YMaps>
    </div>
  );
};

export default App;

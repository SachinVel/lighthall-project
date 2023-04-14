import { useEffect, useState } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, query, collection, getDocs } from "firebase/firestore";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import RoomIcon from '@mui/icons-material/Room';
import L from 'leaflet';


import './App.css';
import { Button, Typography } from '@mui/material';
import { Box } from '@mui/system';

import './App.css';
import "leaflet/dist/leaflet.css";


L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png')
});


function App() {

  const [totalCount, setTotalCount] = useState(null);
  const [markerArr, setMarkerArr] = useState([]);
  const [isLocationSupported, setIsLocationSupported] = useState(true);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);
  const [lat, setLat] = useState(null);
  const [long, setLong] = useState(null);

  const firebaseConfig = {
    apiKey: "AIzaSyDJjiMhDEeosN2FHc1TIC4mrWeHuCS_i2s",
    authDomain: "lighthall-134f1.firebaseapp.com",
    projectId: "lighthall-134f1",
    storageBucket: "lighthall-134f1.appspot.com",
    messagingSenderId: "698904814410",
    appId: "1:698904814410:web:89614660c0d088150757b3",
    measurementId: "G-GZQTRBPK4X"
  };
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const counterRef = doc(db, "clickInfo", "counter");

  const centerPos = [47.116386, -101.299591];

  const onSuccessLocation = (position) => {

    console.log('pos : ',position);
    let latitude = position.coords.latitude;
    let longitude = position.coords.longitude;
    latitude = Math.trunc(latitude * 1000) / 1000;
    longitude = Math.trunc(longitude * 1000) / 1000;
    // console.log('lat : ',latitude,' long : ',longitude);
    setLat(latitude);
    setLong(longitude);

  }

  const onErrorLocation = (position) => {
    setIsPermissionDenied(true);
  }

  const fetchGeoData = async () => {
    const q = query(collection(db, "geoData"));

    const querySnapshot = await getDocs(q);
    let curArr = [];
    querySnapshot.forEach((doc) => {
      console.log('doc.data() : ',doc.data())
      curArr.push(doc.data());
    });
    setMarkerArr(curArr);
  }


  useEffect(() => {

    const getClickInfo = async () => {
      const docSnap = await getDoc(counterRef);
      let data = docSnap.data();
      setTotalCount(data.totalClicks);
    }

    if (!navigator.geolocation) {
      setIsLocationSupported(false);
    } else {
      navigator.geolocation.getCurrentPosition(onSuccessLocation, onErrorLocation);
    }

    getClickInfo();
    fetchGeoData();

  }, []);

  const handleIncreaseCounter = async () => {
    const docSnap = await getDoc(counterRef);
    let data = docSnap.data();
    let newCount = data.totalClicks + 1;
    setDoc(counterRef, {
      totalClicks: data.totalClicks + 1
    });
    setTotalCount(newCount);

    if (isLocationSupported && !isPermissionDenied) {
      let curLocDocId = 'A' + lat + 'B' + long;
      let locRef = doc(db, "geoData", curLocDocId);
      const locSnap = await getDoc(locRef);

      if (locSnap.exists()) {
        let curData = locSnap.data();
        curData.clicks = curData.clicks + 1;
        setDoc(locRef, curData);
      } else {
        let curData = {
          lat: lat,
          long: long,
          clicks: 1
        };
        setDoc(locRef, curData);
      }

      fetchGeoData();

    }

  }

  return (
    <div className="App">
      {
        totalCount !== null &&
        <Box className="counter-container">
          <Typography sx={{
            fontSize: "30px",
            color: "red"
          }}>{totalCount}</Typography>
          <br></br>
          <Button variant='contained' onClick={() => { handleIncreaseCounter() }}>Increase Counter</Button>
        </Box>
      }

      <MapContainer center={centerPos} zoom={3} scrollWheelZoom={false} className="map-container">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {
          markerArr.length > 0 &&
          markerArr.map((loc) => {
            let position = [loc.lat, loc.long];
            let clickInfo = 'Clicks : '+loc.clicks;
            return (
              <Marker position={position} key={position}>
                <Popup>{clickInfo}</Popup>
              </Marker>
            )
          })
        }
      </MapContainer>

    </div>
  );
}

export default App;

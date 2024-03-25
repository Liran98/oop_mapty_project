
////////////////////////////////////////////////////////////////////////////////////
//? APPLICATION ARCHITECTURE
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');

const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');

const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

const overlay = document.querySelector('.overlay');

const openmodal = document.querySelector('.modal');

const errmodal = document.querySelector('.ERRmodal');
const overlayErr = document.querySelector('.erroverlay');

const months = ['jan', 'feb', 'mar'
  , 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];



//? CLASS WORKOUT
class Workout {
  id = '#' + Math.floor(Math.random() * 1500) * 10 / 2;
  date = new Date();

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  _desc() {
    let desc;
    switch (this.date.getDate()) {
      case 3:
        desc = 'rd';
        break;
      case 2:
        desc = 'nd';
        break;
      case 1:
        desc = 'st';
        break;
      default:
        desc = 'th'
    }

    this.description = `${this.type === 'running' ? 'Running' : 'Cycling'}
    ${this.distance} km
     on ${months[this.date.getMonth()]} ${this.date.getDate()}${desc} 
     ${this.type === 'running' ? '🏃' : '🚴‍♂️'}`
  }

}
//?CLASS RUNNING
class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.pace = this._pace();
    this._desc();
  }
  _pace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
//? CLASS CYCLING
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this._desc();
    this._calcspeed();
  }
  _calcspeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}



//? CLASS APP
class App {
  map;
  mapEvent;
  workouts = [];

  constructor() {


    this._getPosition();

    this._getLocalstorage();


    form.addEventListener('submit', this._newWorkout.bind(this));

    inputType.addEventListener("change", this._toggleElevationField);

    document.querySelector('.logo').addEventListener('click', this._reset);

    overlay.addEventListener('click', this._toggleOverlay);

    containerWorkouts.addEventListener('mouseover', this._markerLocation.bind(this));
    overlayErr.addEventListener('click', this._toggleErrPosition);
  };



  //? GETTING POSITON WITH GEOLOCATION (SUCCESS,ERROR)
  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this) //? SUCCESS OF FINDING LOCATION
        , this._toggleErrPosition); //! ERROR WHEN CANNOT GET ACCESS 
  };



  //? LOADING MAP
  _loadMap() {
    this.map = L.map('map').setView([25.780107118422244, -80.21392822265626], 9);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    this.map.on('click', this._showForm.bind(this));

    //* RENDER WORKOUT MARKERS FROM LOCAL STORAGE
    this.workouts.forEach((workout) => {
      this._renderWorkoutLocation(workout);
    })
  };



  //? SHOW FORM WHEN CLICKING ON THE MAP
  _showForm(mapE) {
    this.mapEvent = mapE;
    console.log(mapE);
    form.classList.remove('hidden');
    inputDistance.focus();
  };



  //? HIDES FORM WHEN ADDING A NEW WORKOUT
  _hideForm() {
    form.classList.add('hidden');
    inputCadence.value = '';
    inputDistance.value = '';
    inputDuration.value = '';
    inputElevation.value = '';
  };



  //? TOGGLE HANDLERS
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  };
  _toggleOverlay() {
    overlay.classList.toggle('hidden');
    openmodal.classList.toggle('hidden');
  };
  _toggleErrPosition() {
    errmodal.classList.toggle('hidden');
    overlayErr.classList.toggle('hidden');
  };



  //? NEW WORKOUT WHEN CLICKING ON MAP
  _newWorkout(e) {
    const PositiveNum = function (...inputs) {
      return inputs.every(function (input) {
        return input > 0;
      });
    };
const isnumber = function(...inputs){
  return inputs.every(function(num){
    return  Number.isFinite(num);
  })
}


    e.preventDefault();
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const type = inputType.value;

    const { lat, lng } = this.mapEvent.latlng;
    const markerCoords = [lat, lng];

    let workout;

    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (
        !PositiveNum(distance, duration, cadence) 
         ||
      !isnumber(distance,duration,cadence)
      )
        return this._toggleOverlay();

      workout = new Running(markerCoords, distance, duration, cadence);
    }

    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !PositiveNum(distance, duration, elevation) 
      ||
        !isnumber(distance,duration)
        )
        return this._toggleOverlay();

      workout = new Cycling(markerCoords, distance, duration, elevation);
    }
    this.workouts.push(workout);
    console.log(this.workouts);


    this._renderWorkoutLocation(workout);
    this._renderWorkout(workout);
    this._hideForm();
    this._setLocalstorage();
  };



  //? GET WORKOUT LOCATION COORDS AND ADD MARKER
  _renderWorkoutLocation(workout) {
    const myIcon = L.icon({
      iconUrl: `flag--${workout.type}.png`,
      iconSize: [35, 55],
      iconAnchor: [22, 94],
      popupAnchor: [-3, -76],
      shadowUrl: '',
      shadowSize: [68, 95],
      shadowAnchor: [22, 94]
    });
    L.marker(workout.coords, { icon: myIcon })
      .addTo(this.map)
      .bindPopup(L.popup({
        autoClose: false,
        className: `${workout.type}-popup`,
        maxWidth: 250,
        minWidth: 100,
        content: workout.description,
        closeOnClick: false,
      }))
      .openPopup();
  };



  //? CHANGE MAP VIEW ON MOUSE OVER THE CONTAINER
  _markerLocation(e) {
    e.preventDefault();

    const getlocation = e.target.closest('.workout');
    if (!getlocation) return;

    const workout = this.workouts.find((work) => {
      return work.id === getlocation.dataset.id;
    });

    this.map.setView(workout.coords, 12, {
      animate: true,
      pan: {
        duration: 0.5
      }
    });
  };



  //? RENDERING WORKOUT IN CARDS 
  _renderWorkout(workout) {
    const cycle = `
    <span class="workout__icon">🏔️</span>
    <span class="workout__value">${workout.elevation}</span>
    <span class="workout__unit">m</span>
    `;
    const run = `
    <span class="workout__icon">🦶🏼</span>
    <span class="workout__value">${workout.cadence}</span>
    <span class="workout__unit">spm</span>
  `;

    const html = ` <li class="workout workout--${workout.type}" data-id="${workout.id}">
    <img src="trash-bin.png" class="close-icon"/>

    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${workout.type === 'running' ? '🏃' : '🚴‍♂️'}</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">
      ${workout.type === 'running' ? workout.pace : workout.speed}   </span>
      <span class="workout__unit">
      ${workout.type === 'running' ? 'min/km' : 'km/h'}
      </span>
    </div>
    <div class="workout__details">
    ${workout.type === 'running' ? run : cycle} </div>
    </li>`;

    form.insertAdjacentHTML('afterend', html);
    //* BIN ICON TO DELETE WORKOUT
    document.querySelector('.close-icon').addEventListener('click', this._deleteworkout.bind(this));
  };



  //? SET LOCAL STORAGE
  _setLocalstorage() {
    localStorage.setItem('workouts', JSON.stringify(this.workouts));
  };

  //? GET LOCAL STORAGE
  _getLocalstorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    console.log(data);
    if (!data) return;

    this.workouts = data;
    //*RENDER WORKOUTS FROM LOCAL STORAGE
    this.workouts.forEach((workout) => {
      this._renderWorkout(workout);
    })
  };



  //? RESET LOCAL STORAGE
  _reset() {
    localStorage.removeItem('workouts');
    location.reload();
  };



  //? DELETE WORKOUT
  _deleteworkout(e) {
    const workoutEL = e.target.closest('.workout');

    const index = this.workouts.findIndex((item) => {
      return item.id === workoutEL.dataset.id;
    })
    workoutEL.style.opacity = 0;

    this.workouts.splice(index, 1);

    this._setLocalstorage();

    location.reload();
  };
};

const app = new App();




































        //? firstname is from other.js
    // console.log(firstname);


     //?different ways of destructring objects
      // const {coords:{ latitude, longitude}} = position;
      // const { latitude, longitude } = position.coords;
      // const latitude = position.coords.latitude;
      // const longitude = position.coords.longitude;

      // console.log(`https://www.google.pt/maps/@${latitude},${longitude}`);

      // const coordinates = [latitude, longitude];
// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

// The store will hold all information needed globally
var store = {
	tracks: null,
	racers: null,
	track_id: null,
	player_id: null,
	race_id: null,
};
let lastRaceId;
// We need our javascript to wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
	onPageLoad();
	setupClickHandlers();
});

function updateStore(updates, cb) {
	store = {
		...store,
		...updates,
	};

	if (cb) {
		return cb(store);
	}

	return store;
}

async function onPageLoad() {
	const page = window.location.href.split("/").pop();

	if (page === "race") {

		await Promise.all([
			getTracks()
				.then((tracks) => tracks.json())
				.then((tracks) => {
					updateStore(
						{
							tracks,
						},
						console.log
					);
					const html = renderTrackCards(tracks);
					renderAt("#tracks", html);
				}),
			getRacers()
				.then((racers) => racers.json())
				.then((racers) => {
					updateStore(
						{
							racers,
						},
						console.log
					);
					const html = renderRacerCars(racers);
					renderAt("#racers", html);
				}),
		]);
	}


}

function setupClickHandlers() {
	document.addEventListener(
		"click",
		function (event) {
			const { target } = event;
			//   console.log(event.path[0].matches(".card.track"), target.id);
			// Race track form field

			// Submit create race form
			if (target.matches("#submit-create-race")) {
				event.preventDefault();
				// instead update in the server
				// updateStore(
				//   {
				//     race_id: lastRaceId ? lastRaceId++ : 1,
				//   },
				//   console.log
				// );
				// start race
				race();
				return;
			}
			// console.log('Event current target ', event.currentTarget)
			// if (event.currentTarget === this.body) {
			// 	event.stopPropagation()
			// 	return
			// }
			// Handle acceleration click
			if (target.matches("#gas-peddle")) {
				handleAccelerate(store.race_id - 1);
			}

			for (let i = 0; i < event.path.length; i++) {
				if (event.path[i].matches === undefined) {
					// event.stopPropagation()
					return
				}
				if (event.path[i].matches([".card.track"])) {
					handleSelectTrack(event.path[i]);
					break;
				}

				// Podracer form field
				if (event.path[i].matches(".card.podracer")) {
					handleSelectPodRacer(event.path[i]);
					break;
				}
			}
		},
		false
	);
}

async function delay(ms) {
	return await new Promise((resolve) => setTimeout(resolve, ms));
}
// ^ PROVIDED CODE ^ DO NOT REMOVE

// This async function controls the flow of the race
async function race() {
	// render starting UI
	const { player_id, track_id } = store;
	// const selectedTrack = store.tracks.filter(track => track.id === track_id)
	renderAt("#race", renderRaceStartView(track_id));

	// TODO - Get player_id and track_id from the store

	const newRace = await createRace(player_id, track_id)
	console.log('new Race ', newRace)
	// Instead I will use the api provided
	// const newRace = await fetch(
	// 	"/api/races",
	// 	{
	// 		...defaultFetchOpts(),
	// 		method: "POST",
	// 	},
	// 	{
	// 		//   id: lastRaceId, get the id from the server
	// 		track: tracks.filter((track) => track.id === track_id).name,
	// 		player_id,
	// 		cars: state.racers,
	// 		results: [],
	// 	}
	// ); 

	// TODO - invoke the API call to create the race, then save the result

	// TODO - update the store with the race id
	updateStore({
		race_id: +newRace.ID
	}, console.log)
	// The race has been created, now start the countdown
	// TODO - call the async function runCountdown
	await runCountdown(1)
	// TODO - call the async function startRace
	console.log(store)
	await startRace(store.race_id - 1) // there is a bug, since the race id starts from 1 and it checks the race by using, races[race_id], it is out of bounds
	// TODO - call the async function runRace
	await runRace(store.race_id - 1)
}
async function runCountdown(timer) {
	// wait for the DOM to load
	await delay(1000);

	return new Promise((resolve) => {
		// TODO - use Javascript's built in setInterval method to count down once per second
		const countdown = setInterval(() => {
			// run this DOM manipulation to decrement the countdown for the user
			document.getElementById("big-numbers").innerHTML = --timer;
			if (timer <= 0) {
				clearInterval(countdown);
				resolve()
			}
		}, 1000)

		// TODO - if the countdown is done, clear the interval, resolve the promise, and return
	});
}

async function runRace(raceID) {
	return new Promise((resolve) => {
		// TODO - use Javascript's built in setInterval method to get race info twice a second
		const showMustGoOn = setInterval(async () => {
			const raceStats = await getRace(raceID).then(res => res.json()).then(res => res)
			if (raceStats.status === 'in-progress') {
				renderAt('#leaderBoard', raceProgress(raceStats.positions))
			}
			if (raceStats.status === 'finished') {
				clearInterval(showMustGoOn)
				renderAt('#race', resultsView(raceStats.positions)) // to render the results view
				resolve(raceStats) // resolve the promise
			}

		}, 500)
		/* 
			TODO - if the race info status property is "in-progress", update the leaderboard by calling:
	
			renderAt('#leaderBoard', raceProgress(res.positions))
		*/
		/* 
			TODO - if the race info status property is "finished", run the following:
	
			clearInterval(raceInterval) // to stop the interval from repeating
			renderAt('#race', resultsView(res.positions)) // to render the results view
			reslove(res) // resolve the promise
		*/
	});
}

function handleSelectPodRacer(target) {
	console.log("selected a pod", target);

	// remove class selected from all racer options
	const selected = document.querySelector("#racers .selected");
	if (selected) {
		selected.classList.remove("selected");
	}

	// add class selected to current target
	target.classList.add("selected");

	updateStore(
		{
			player_id: +target.id,
		},
		console.log
	);
}

function handleSelectTrack(target) {
	console.log("selected a track", target.innerText);

	// remove class selected from all track options
	const selected = document.querySelector("#tracks .selected");
	if (selected) {
		selected.classList.remove("selected");
	}

	// add class selected to current target
	target.classList.add("selected");
	updateStore(
		{
			track_id: target.innerText, // since track property is string in /api/races endpoint I am using the name of the track here. I am not sure which one is expected. id int value as string or name value ?
		},
		console.log
	);
}

async function handleAccelerate(id) {
	console.log("accelerate button clicked ", id);
	// TODO - Invoke the API call to accelerate
	await accelerate(id)
}

// HTML VIEWS ------------------------------------------------
// Provided code - do not remove

function renderRacerCars(racers) {
	if (!tracks.length) {
		return `
			<h4>Loading Racers...</4>
		`;
	}

	const results = racers.map(renderRacerCard).join("");
	return `
		<ul id="racers">
			${results}
		</ul>
	`;
}

function renderRacerCard(racer) {
	const { id, driver_name, top_speed, acceleration, handling } = racer;
	return `
		<li class="card podracer" id="${id}">
			<h3>${driver_name}</h3>
			<p>${top_speed}</p>
			<p>${acceleration}</p>
			<p>${handling}</p>
		</li>
	`;
}

function renderTrackCards(tracks) {
	if (!tracks.length) {
		return `
			<h4>Loading Tracks...</4>
		`;
	}

	const results = tracks.map(renderTrackCard).join("");

	return `
		<ul id="tracks">
			${results}
		</ul>
	`;
}

function renderTrackCard(track) {
	const { id, name } = track;

	return `
		<li id="${id}" class="card track">
			<h3>${name}</h3>
		</li>
	`;
}

function renderCountdown(count) {
	return `
		h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`;
}

function renderRaceStartView(track, racers) {
	return `
		<header>
			<h1>Race: ${track.name}</h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(3)}
			</section>

			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me To Win!</button>
			</section>
		</main>
		<footer></footer>
	`;
}

function resultsView(positions) {
	positions.sort((a, b) => (a.final_position > b.final_position ? 1 : -1));

	return `
		<header>
			<h1>Race Results</h1>
		</header>
		<main>
			${raceProgress(positions)}
			<a href="/race">Start a new race</a>
		</main>
	`;
}

function raceProgress(positions) {
	let userPlayer = positions.find((e) => e.id === store.player_id);
	userPlayer.driver_name += " (you)";

	const results = positions.map((p) => {
		return `
			<tr>
				<td>
					<h3>${p.final_position ? p.final_position : '...'} - ${p.driver_name}</h3>
				</td>
			</tr>
		`;
	});

	return `
		<header>
			<h1>Race Results</h1>
		</header>
		<main>
			<section id="leaderBoard">
				${results}
			</section>
		</main>
	`;
}

function renderAt(element, html) {
	let node = null;
	console.log(element.match(/^#/));

	if (element.match(/^#/).length) {
		console.log(element.substr(1));
		node = document.getElementById(element.substr(1));
	}

	if (element.match(/^\./) !== null && element.match(/^\./).length) {
		node = document.getElementsByClassName(element.substr(1));
	}
	node.innerHTML = html;
}

// ^ Provided code ^ do not remove

// API CALLS ------------------------------------------------

const SERVER = "http://localhost:8000";

function defaultFetchOpts() {
	return {
		// otherwise the server does not give any response
		mode: "cors",
		headers: {
			"Content-Type": "application/json",
			"Access-Control-Allow-Origin": SERVER,
		},
	};
}

// TODO - Make a fetch call to each of the following API endpoints

function getTracks() {
	// GET request to `${SERVER}/api/tracks`
	return fetch(`${SERVER}/api/tracks`, { ...defaultFetchOpts() });
}

function getRacers() {
	// GET request to `${SERVER}/api/cars`
	return fetch(`${SERVER}/api/cars`, { ...defaultFetchOpts() });
}

function createRace(player_id, track_id) {
	// console.log(player_id, track_id)
	const body = { player_id, track_id }; // track_id here is the name of the track

	// return fetch(`${SERVER}/api/races`, {
	// 	...defaultFetchOpts(),
	// 	// "Access-Control-Allow-Origin": 'http://localhost:3000',
	// 	method: "POST",
	// 	dataType: "jsonp",
	// 	body: JSON.stringify(body),
	// 	// body: JSON.stringify(body)
	// })
	return fetch(`${SERVER}/api/races`, {
		...defaultFetchOpts(),
		headers: {
			'Content-type': 'text/plain'
		},
		method: 'POST',
		dataType: 'jsonp',
		body: JSON.stringify(body)
	}).then(res => res.json())
}

function getRace(id) {
	// GET request to `${SERVER}/api/races/${id}`
	return fetch(`${SERVER}/api/races/${id}`)
}

function startRace(id) {
	return fetch(`${SERVER}/api/races/${id}/start`, {
		...defaultFetchOpts(),
		method: "POST",
		mode: "cors",
	});
}

function accelerate(id) {
	// POST request to `${SERVER}/api/races/${id}/accelerate`
	// options parameter provided as defaultFetchOpts
	// no body, datatype, or cors needed for this request
	fetch(`${SERVER}/api/races/${id}/accelerate`, {
		...defaultFetchOpts(),
		method: 'POST'
	})
}

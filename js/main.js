const ctx = new (window.AudioContext || window.webkitAudioContext)()
const fft = new AnalyserNode(ctx, { fftSize: 2048 })


function step( rootFreq, steps ) {
    let ratios = [
        1,      // unison ( 1/1 )       // C
        25/24,  // minor second         // C#
        9/8,    // major second         // D
        6/5,    // minor third          // D#
        5/4,    // major third          // E
        4/3,    // fourth               // F
        45/32,  // diminished fifth     // F#
        3/2,    // fifth                // G
        8/5,    // minor sixth          // G#
        5/3,    // major sixth          // A
        9/5,    // minor seventh        // A#
        15/8,   // major seventh        // B
    ]

    if(steps >= ratios.length){
        let octaveShift = Math.floor( steps / ratios.length )
        rootFreq = rootFreq * Math.pow(2,octaveShift)
    }

    let r = steps % ratios.length
    let freq = rootFreq * ratios[r]
    return Math.round(freq*100)/100
}

function tone (type, pitch, time, duration) {
	const t = time || ctx.currentTime
	const dur = duration || 0.25

	const osc = new OscillatorNode(ctx, {type : type || 'sine', frequency: pitch || 440})
	const lvl = new GainNode(ctx, {gain: 0.5})
	osc.connect(lvl)
	lvl.connect(ctx.destination)
	lvl.connect(fft)
	osc.start(t)
	osc.stop(t + dur)
}


function melodyRecursively(steps, scale, base_pitch, cur_step, time, depth, notelen) {
	if (depth == 1){
		for (let s = 0; s < steps.length ; s++){
			let scale_step = steps[s] + cur_step
			let note_step = scale[scale_step % scale.length] + 12 * Math.floor(scale_step / scale.length)
			tone('sine', step(base_pitch, note_step), time + s*notelen, notelen)
		}
	}
	else {
		for (let s = 0; s < steps.length ; s++){
			let scale_step = steps[s] + cur_step
			let note_step = scale[scale_step % scale.length]
			
			melodyRecursively(steps,
						scale,
						base_pitch,
						scale_step,
						time + Math.pow(steps.length, depth-1) * notelen * s,
						depth-1, 
						notelen)
		}
	}
}

const scales =
[[ 0, 2, 4, 5, 7, 9, 11 ],
[0, 2, 3, 5, 7, 8, 10]
]


createWaveCanvas({ element: 'section', analyser: fft })
document.getElementById('stop').addEventListener('click', function() {
	location.reload()
})
document.getElementById('start').addEventListener('click', function() {
	ctx.resume()


	let scale = []
	/*
	for(let i= 0; i < 5; i++){
		let step = Math.floor(Math.random() * 13)
		scale.push(step)
	}*/
	scale = scales[Math.floor(Math.random() * scales.length)]
	console.log('scale', scale)

	//scale = [ 0, 2, 4, 5, 7, 9, 11 ] //// 

	let melody = []
	for(let i= 0; i < 4; i++){
		let step = Math.floor(Math.random() * 8)
		melody.push(step)
	}

	console.log('melody', melody)

	melodyRecursively(melody, scale, 220, 0, ctx.currentTime, 4, 0.15)

})

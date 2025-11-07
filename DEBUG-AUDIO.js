// ========================================
// AUDIO PLAYBACK DIAGNOSTIC SCRIPT
// Paste this entire block into browser console
// ========================================

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║  AUDIO PLAYBACK DIAGNOSTIC TOOL                         ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

// 1. Check if AudioPlaybackController class exists
console.log('1. CHECKING CLASSES:');
console.log('   VibratoSineWaveGenerator:', typeof VibratoSineWaveGenerator !== 'undefined' ? '✅ Defined' : '❌ Missing');
console.log('   AudioPlaybackController:', typeof AudioPlaybackController !== 'undefined' ? '✅ Defined' : '❌ Missing');

// 2. Check if window.audioController exists
console.log('\n2. CHECKING CONTROLLER INSTANCE:');
if (window.audioController) {
    console.log('   window.audioController: ✅ Exists');
    console.log('   Type:', window.audioController.constructor.name);

    // 3. Check AudioContext
    console.log('\n3. CHECKING AUDIO CONTEXT:');
    if (window.audioController.audioContext) {
        console.log('   AudioContext: ✅ Created');
        console.log('   State:', window.audioController.audioContext.state);
        console.log('   Sample Rate:', window.audioController.audioContext.sampleRate, 'Hz');
        console.log('   Master Gain:', window.audioController.masterGain?.gain.value);
    } else {
        console.log('   AudioContext: ❌ Not created yet (will create on first play)');
    }

    // 4. Check notes
    console.log('\n4. CHECKING NOTES:');
    if (window.audioController.notes && window.audioController.notes.length > 0) {
        console.log('   Notes extracted: ✅', window.audioController.notes.length, 'total');
        console.log('   Main notes:', window.audioController.notes.filter(n => !n.isGrace).length);
        console.log('   Grace notes:', window.audioController.notes.filter(n => n.isGrace).length);
        console.log('   First 3 notes:');
        window.audioController.notes.slice(0, 3).forEach((note, i) => {
            console.log(`      ${i}. ${note.pitch} (duration: ${note.duration}, grace: ${note.isGrace})`);
        });
    } else {
        console.log('   Notes: ❌ No notes extracted');
        console.log('   This means setSVGReferences() was not called or SVG has no notes');
    }

    // 5. Check SVG references
    console.log('\n5. CHECKING SVG REFERENCES:');
    console.log('   Optimal SVG:', window.audioController.svgElements.optimal ? '✅' : '❌');
    console.log('   Alt1 SVG:', window.audioController.svgElements.alt1 ? '✅' : '❌');

    // 6. Check actual SVG in DOM
    console.log('\n6. CHECKING SVG ELEMENTS IN DOM:');
    const optimalSvg = document.getElementById('optimalSvg');
    const alt1Svg = document.getElementById('alt1Svg');
    if (optimalSvg) {
        const circles = optimalSvg.querySelectorAll('circle.note, circle.grace-note');
        console.log('   optimalSvg: ✅ Found in DOM');
        console.log('   Circles with .note or .grace-note class:', circles.length);
        if (circles.length > 0) {
            const firstCircle = circles[0];
            console.log('   First circle data-pitch:', firstCircle.getAttribute('data-pitch'));
            console.log('   First circle data-duration:', firstCircle.getAttribute('data-duration'));
            console.log('   First circle classes:', firstCircle.className.baseVal);
        }
    } else {
        console.log('   optimalSvg: ❌ Not found in DOM');
    }
    if (alt1Svg) {
        console.log('   alt1Svg: ✅ Found in DOM');
    } else {
        console.log('   alt1Svg: ❌ Not found in DOM');
    }

} else {
    console.log('   window.audioController: ❌ DOES NOT EXIST');
    console.log('   This means initialization failed or script did not load');
}

// 7. Test manual playback
console.log('\n7. ATTEMPTING MANUAL PLAYBACK TEST:');
if (window.audioController) {
    try {
        console.log('   Calling audioController.play()...');
        window.audioController.play().then(() => {
            console.log('   ✅ Play() completed successfully');
        }).catch(err => {
            console.error('   ❌ Play() failed:', err.message);
        });
    } catch (err) {
        console.error('   ❌ Exception during play():', err.message);
    }
} else {
    console.log('   ⏭️  Skipped (no audioController)');
}

// 8. Browser audio policy check
console.log('\n8. BROWSER AUDIO POLICY:');
if (window.AudioContext || window.webkitAudioContext) {
    console.log('   Web Audio API: ✅ Supported');
    try {
        const testCtx = new (window.AudioContext || window.webkitAudioContext)();
        console.log('   Test AudioContext state:', testCtx.state);
        if (testCtx.state === 'suspended') {
            console.log('   ⚠️  Browser requires user gesture to start audio');
            console.log('   Try clicking the page first, then click play button');
        }
        testCtx.close();
    } catch (err) {
        console.error('   ❌ Failed to create test AudioContext:', err.message);
    }
} else {
    console.log('   Web Audio API: ❌ Not supported in this browser');
}

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║  DIAGNOSTIC COMPLETE                                     ║');
console.log('╚══════════════════════════════════════════════════════════╝');
console.log('\n📋 Copy the output above and share it for detailed analysis.');

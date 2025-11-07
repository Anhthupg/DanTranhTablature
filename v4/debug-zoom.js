// Copy and paste this entire file content into browser console
var r=document.querySelector('g.phrase-box-row1 rect');
console.log('data-base-y:', r ? r.getAttribute('data-base-y') : null);
console.log('data-base-height:', r ? r.getAttribute('data-base-height') : null);
console.log('zoomLinked:', window.zoomController.zoomLinked);
console.log('phrase-box-row1 count:', document.querySelectorAll('g.phrase-box-row1').length);

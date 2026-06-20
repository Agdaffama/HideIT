// STATE
let currentAlgo = 'aes', currentCryptoMode = 'encrypt', currentStegoMode = 'embed', currentDualMode = 'encode';
let coverImageData = null, coverImageFile = null, dualImageData = null, dualImageFile = null;
let vaultImageData = null, vaultImageFile = null, stegoResultCanvas = null, dualResultCanvas = null;

// NAVIGATION
function switchModule(mod) {
  ['crypto','stego','dual'].forEach(m => {
    document.getElementById('module-'+m).classList.toggle('active', m===mod);
    document.getElementById('tab-'+m).classList.toggle('active', m===mod);
  });
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const map = {crypto:0,stego:1,dual:2};
  document.querySelectorAll('.nav-item')[map[mod]].classList.add('active');
}

// TOAST
function showToast(msg, type) {
  type = type||'success';
  const t = document.getElementById('toast');
  const icons = {success:'v',error:'x',info:'i'};
  document.getElementById('toast-icon').textContent = icons[type]||'v';
  document.getElementById('toast-msg').textContent = msg;
  t.className = 'toast toast-'+type+' visible';
  setTimeout(function(){ t.classList.remove('visible'); }, 3200);
}

// NEW SESSION - resets ALL modules
function resetFileInput(id) {
  // Clone and replace to guarantee file input clears across all browsers
  var el = document.getElementById(id);
  if (!el) return;
  var clone = el.cloneNode(true);
  el.parentNode.replaceChild(clone, el);
}

function resetDropZone(wrapId, iconText, mainText, subText) {
  var wrap = document.getElementById(wrapId);
  if (wrap) wrap.innerHTML =
    '<div class=drop-zone-icon>' + iconText + '</div>' +
    '<div class=drop-zone-text>' + mainText + '</div>' +
    '<div class=drop-zone-sub>' + subText + '</div>';
}

function clearSession() {
  try {
    // ── CRYPTO ──────────────────────────────────
    document.getElementById('crypto-input').value = '';
    resetPasswordField('aes-key');
    document.getElementById('caesar-key').value = 3;
    document.getElementById('vigenere-key').value = 'KEY';
    document.getElementById('affine-b').value = 8;
    document.getElementById('char-count').textContent = 'CHARS: 0';
    var rText = document.getElementById('crypto-result-text');
    rText.textContent = '-- awaiting transform --';
    rText.style.opacity = '0.4';
    clearCryptoLogs();
    logCrypto('SESSION CLEARED. NODE RESET.', 'warn');
  } catch(e) { console.warn('Crypto reset error:', e); }

  try {
    // ── STEGANOGRAPHY ────────────────────────────
    coverImageData = null; coverImageFile = null; stegoResultCanvas = null;

    document.getElementById('stego-input').value = '';
    resetPasswordField('stego-key');
    document.getElementById('use-xor').checked = false;
    document.getElementById('lsb-method').selectedIndex = 0;
    document.getElementById('stego-byte-count').textContent = '0 / 4096 BYTES';

    // Reset file input (clone trick for cross-browser reliability)
    resetFileInput('cover-file-input');

    // Restore drop zone placeholder
    resetDropZone('cover-preview-wrap', '&#8679;', 'Drag and drop PNG/JPG', 'MAX: 12MB');

    document.getElementById('img-compare').style.display = 'none';
    document.getElementById('stego-placeholder').style.display = '';
    document.getElementById('stego-metrics').style.display = 'none';
    document.getElementById('stego-histogram-panel').style.display = 'none';
    document.getElementById('stego-preview').src = '';
    document.getElementById('stego-preview').style.opacity = '0.3';
    document.getElementById('orig-preview').src = '';
    document.getElementById('stego-badge').style.display = 'none';
    document.getElementById('stego-download-btn').style.display = 'none';

    var exText = document.getElementById('extract-result-text');
    exText.textContent = '-- awaiting extraction --';
    exText.style.opacity = '0.4';

    document.getElementById('stego-terminal').innerHTML = '';
    logStego('SESSION CLEARED. NODE RESET.', 'warn');
    logStego('SIGNAL HIDE ENGINE STANDBY. AWAITING COVER IMAGE...', 'info');

    setStegoMode('embed');
  } catch(e) { console.warn('Stego reset error:', e); }

  try {
    // ── DUAL-LOCK ────────────────────────────────
    dualImageData = null; dualImageFile = null;
    vaultImageData = null; vaultImageFile = null;
    dualResultCanvas = null;

    document.getElementById('dual-plaintext').value = '';
    resetPasswordField('dual-password');
    document.getElementById('entropy-bar').style.width = '0%';

    // Reset file inputs (clone trick)
    resetFileInput('dual-file-input');
    resetFileInput('vault-file-input');

    // Restore drop zone placeholders
    resetDropZone('dual-preview-wrap', '&#8679;', 'Drag and drop cover image', 'PNG / JPG recommended');
    resetDropZone('vault-preview-wrap', '&#128274;', 'Upload Vault PNG', 'Must be exported from Dual-Lock Encode');

    document.getElementById('dual-result-section').style.display = 'none';
    document.getElementById('dual-download-btn').style.display = 'none';
    document.getElementById('dual-result').style.display = 'none';
    document.getElementById('dual-result-text').textContent = '';
    document.getElementById('dual-image-result').style.display = 'none';
    document.getElementById('dual-metrics').style.display = 'none';
    document.getElementById('dual-histogram-panel').style.display = 'none';
    document.getElementById('dual-loading').classList.remove('show');
    document.getElementById('dual-progress').style.width = '0%';

    var ps = document.getElementById('pipeline-status');
    ps.textContent = 'STATUS: READY';
    ps.className = 'pipeline-status ready';
    ps.style.color = '';

    document.getElementById('dual-terminal').innerHTML = '';
    logDual('SESSION CLEARED. NODE RESET.', 'warn');
    logDual('DUAL-LOCK ENGINE STANDBY. AWAITING INPUT...', 'info');

    setDualMode('encode');
  } catch(e) { console.warn('Dual-Lock reset error:', e); }

  showToast('Session cleared — all modules reset.', 'info');
}

// CRYPTO
function selectAlgo(el, algo) {
  document.querySelectorAll('.algo-item').forEach(function(a){ a.classList.remove('selected'); });
  el.classList.add('selected');
  currentAlgo = algo;
  ['aes','caesar','vigenere','affine'].forEach(function(a){
    document.getElementById('key-panel-'+a).style.display = a===algo ? '' : 'none';
  });
  var names = {aes:'AES-256',caesar:'CAESAR',vigenere:'VIGENERE',affine:'AFFINE'};
  document.getElementById('sb-algo').textContent = names[algo];
}
function setMode(mode) {
  currentCryptoMode = mode;
  document.getElementById('mode-enc').classList.toggle('active-mode', mode==='encrypt');
  document.getElementById('mode-dec').classList.toggle('active-mode', mode==='decrypt');
}
function updateCharCount() {
  document.getElementById('char-count').textContent = 'CHARS: ' + document.getElementById('crypto-input').value.length;
}
function clearCryptoLogs() {
  document.getElementById('crypto-terminal').innerHTML = '';
  logCrypto('LOGS CLEARED.', 'muted');
}
function logCrypto(msg, cls) {
  cls = cls||'';
  var t = new Date();
  var ts = '['+pad(t.getHours())+':'+pad(t.getMinutes())+':'+pad(t.getSeconds())+']';
  var term = document.getElementById('crypto-terminal');
  var line = document.createElement('div'); line.className = 'log-line';
  line.innerHTML = '<span class="log-time">'+ts+'</span><span class="log-text '+cls+'">'+msg+'</span>';
  term.appendChild(line); term.scrollTop = term.scrollHeight;
}
function pad(n){ return String(n).padStart(2,'0'); }
function togglePasswordVisibility(id, btn) {
  var el = document.getElementById(id);
  if (!el) return;
  var revealed = el.type === 'password';
  el.type = revealed ? 'text' : 'password';
  btn.classList.toggle('revealed', revealed);
}
function resetPasswordField(id) {
  var el = document.getElementById(id);
  if (!el) return;
  el.value = '';
  el.type = 'password';
  var wrap = el.closest('.pw-wrap');
  if (wrap) {
    var btn = wrap.querySelector('.pw-toggle');
    if (btn) btn.classList.remove('revealed');
  }
}
function logStego(msg, cls) {
  cls = cls||'';
  var t = new Date();
  var ts = '['+pad(t.getHours())+':'+pad(t.getMinutes())+':'+pad(t.getSeconds())+']';
  var term = document.getElementById('stego-terminal');
  if (!term) return;
  var line = document.createElement('div'); line.className = 'log-line';
  line.innerHTML = '<span class="log-time">'+ts+'</span><span class="log-text '+cls+'">'+msg+'</span>';
  term.appendChild(line); term.scrollTop = term.scrollHeight;
}
function clearStegoLogs() {
  document.getElementById('stego-terminal').innerHTML = '';
  logStego('LOGS CLEARED.', 'muted');
}
function copyResult(id) {
  var el = document.getElementById(id);
  navigator.clipboard.writeText(el.textContent||el.innerText).then(function(){ showToast('Copied to clipboard.','info'); });
}

// CIPHERS
function xorCipher(text, key) {
  if (!key) return text;
  return text.split('').map(function(c,i){ return String.fromCharCode(c.charCodeAt(0)^key.charCodeAt(i%key.length)); }).join('');
}
function caesarCipher(text, key, mode) {
  var shift = mode==='encrypt' ? key : -key;
  return text.split('').map(function(c){
    if (/[a-zA-Z]/.test(c)){ var b=c===c.toUpperCase()?65:97; return String.fromCharCode((c.charCodeAt(0)-b+shift+2600)%26+b); }
    return c;
  }).join('');
}
function vigenereCipher(text, key, mode) {
  if (!key) return text;
  var k=key.toUpperCase(), ki=0;
  return text.split('').map(function(c){
    if (/[a-zA-Z]/.test(c)){
      var b=c===c.toUpperCase()?65:97, ks=k.charCodeAt(ki%k.length)-65;
      if(mode==='decrypt') ks=-ks; ki++;
      return String.fromCharCode((c.charCodeAt(0)-b+ks+2600)%26+b);
    } return c;
  }).join('');
}
function gcd(a,b){ return b===0?a:gcd(b,a%b); }
function affineCipher(text, a, b, mode) {
  if (gcd(a,26)!==1) return 'ERROR: Multiplier "a" must be coprime with 26.';
  var aInv=0;
  for(var i=0;i<26;i++){if((a*i)%26===1){aInv=i;break;}}
  return text.split('').map(function(c){
    if(/[a-zA-Z]/.test(c)){
      var base=c===c.toUpperCase()?65:97, x=c.charCodeAt(0)-base;
      var r=mode==='encrypt'?(a*x+b)%26:(aInv*(x-b+2600))%26;
      return String.fromCharCode(r+base);
    } return c;
  }).join('');
}
async function aesEncrypt(plaintext, password) {
  var enc = new TextEncoder();
  var km = await crypto.subtle.importKey('raw', enc.encode(password), {name:'PBKDF2'}, false, ['deriveKey']);
  var salt = crypto.getRandomValues(new Uint8Array(16));
  var key = await crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:100000,hash:'SHA-256'},km,{name:'AES-CBC',length:256},false,['encrypt']);
  var iv = crypto.getRandomValues(new Uint8Array(16));
  var ct = await crypto.subtle.encrypt({name:'AES-CBC',iv},key,enc.encode(plaintext));
  var combined = new Uint8Array(salt.length+iv.length+ct.byteLength);
  combined.set(salt,0); combined.set(iv,16); combined.set(new Uint8Array(ct),32);
  return btoa(String.fromCharCode.apply(null,combined));
}
async function aesDecrypt(b64, password) {
  try {
    var data = Uint8Array.from(atob(b64),function(c){return c.charCodeAt(0);});
    var salt=data.slice(0,16), iv=data.slice(16,32), ct=data.slice(32);
    var enc=new TextEncoder();
    var km=await crypto.subtle.importKey('raw',enc.encode(password),{name:'PBKDF2'},false,['deriveKey']);
    var key=await crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:100000,hash:'SHA-256'},km,{name:'AES-CBC',length:256},false,['decrypt']);
    var pt=await crypto.subtle.decrypt({name:'AES-CBC',iv},key,ct);
    return new TextDecoder().decode(pt);
  } catch(e){ return '[DECRYPTION ERROR] Wrong key or corrupted data.'; }
}
async function executeCrypto() {
  var text = document.getElementById('crypto-input').value;
  if (!text){ showToast('Input payload is empty.','error'); return; }
  var t0 = performance.now();
  logCrypto('INITIATING '+currentCryptoMode.toUpperCase()+' -> ALGO: '+currentAlgo.toUpperCase());
  var result = '';
  try {
    if (currentAlgo==='aes') {
      var key=document.getElementById('aes-key').value;
      if(!key){showToast('AES key required.','error');return;}
      logCrypto('DERIVING KEY (SHA-256)...','info');
      result = currentCryptoMode==='encrypt' ? await aesEncrypt(text,key) : await aesDecrypt(text,key);
      logCrypto('AES-CBC '+currentCryptoMode.toUpperCase()+' COMPLETE.');
    } else if (currentAlgo==='caesar') {
      var k=parseInt(document.getElementById('caesar-key').value)||3;
      result=caesarCipher(text,k,currentCryptoMode); logCrypto('CAESAR SHIFT_KEY: '+k+' DONE.');
    } else if (currentAlgo==='vigenere') {
      var k=document.getElementById('vigenere-key').value||'KEY';
      result=vigenereCipher(text,k,currentCryptoMode); logCrypto('VIGENERE KEYWORD: '+k.toUpperCase()+' DONE.');
    } else if (currentAlgo==='affine') {
      var a=parseInt(document.getElementById('affine-a').value), b=parseInt(document.getElementById('affine-b').value);
      result=affineCipher(text,a,b,currentCryptoMode);
      if(result.startsWith('ERROR')){logCrypto(result,'error');showToast(result,'error');return;}
      logCrypto('AFFINE A='+a+' B='+b+' DONE.');
    }
    var elapsed=(performance.now()-t0).toFixed(2);
    logCrypto('TRANSFORM COMPLETE. ELAPSED: '+elapsed+'ms');
    document.getElementById('sb-latency').textContent=elapsed+'MS';
    var rt=document.getElementById('crypto-result-text');
    rt.textContent=result; rt.style.opacity='1';
    showToast((currentCryptoMode==='encrypt'?'Encryption':'Decryption')+' complete.','success');
  } catch(e){ logCrypto('ERROR: '+e.message,'error'); showToast('Operation failed.','error'); }
}

// STEGANOGRAPHY
function setStegoMode(mode) {
  currentStegoMode = mode;
  document.getElementById('stego-embed-btn').classList.toggle('active-mode', mode==='embed');
  document.getElementById('stego-extract-btn').classList.toggle('active-mode', mode==='extract');
  document.getElementById('stego-payload-panel').style.display = mode==='embed' ? '' : 'none';
  document.getElementById('stego-action-btn').textContent = mode==='embed' ? 'EXECUTE EMBEDDING' : 'EXECUTE EXTRACTION';
  document.getElementById('stego-result-item').style.display = mode==='embed' ? '' : 'none';
  document.getElementById('extract-result-panel').style.display = mode==='extract' ? '' : 'none';
  document.getElementById('stego-metrics').style.display = 'none';
  if(mode==='extract') document.getElementById('stego-histogram-panel').style.display='none';
  logStego('MODE SWITCH -> '+mode.toUpperCase()+' SELECTED.', 'info');
}
function updateStegoBytes() {
  var len = new TextEncoder().encode(document.getElementById('stego-input').value).length;
  document.getElementById('stego-byte-count').textContent = len+' / 4096 BYTES';
}
function handleDrop(e, target) { e.preventDefault(); var f=e.dataTransfer.files[0]; if(f) loadDroppedFile(f,target); }
function dragOver(e){ e.preventDefault(); e.currentTarget.classList.add('dragging'); }
function dragLeave(e){ e.currentTarget.classList.remove('dragging'); }
function handleFile(input, target){ if(input.files[0]) loadDroppedFile(input.files[0],target); }
function loadDroppedFile(file, target) {
  var reader = new FileReader();
  reader.onload = function(e) {
    var src = e.target.result;
    var img = new Image();
    img.onload = function() {
      var canvas=document.createElement('canvas');
      canvas.width=img.width; canvas.height=img.height;
      var ctx=canvas.getContext('2d'); ctx.drawImage(img,0,0);
      var imgData=ctx.getImageData(0,0,canvas.width,canvas.height);
      if(target==='cover'){
        coverImageData=imgData; coverImageFile=file;
        showImagePreview('cover-preview-wrap',src,'cover');
        document.getElementById('orig-preview').src=src;
        document.getElementById('img-compare').style.display='grid';
        document.getElementById('stego-placeholder').style.display='none';
        logStego('COVER IMAGE LOADED: '+file.name+' ('+img.width+'x'+img.height+').');
      } else if(target==='dual'){
        dualImageData=imgData; dualImageFile=file;
        showImagePreview('dual-preview-wrap',src,'dual');
      } else if(target==='vault'){
        vaultImageData=imgData; vaultImageFile=file;
        showImagePreview('vault-preview-wrap',src,'vault');
      }
    };
    img.src=src;
  };
  reader.readAsDataURL(file);
}
function showImagePreview(wrapId, src, target) {
  var clearBtn = target ? '<button class="btn-clear-img" onclick="clearImage(\''+target+'\')" title="Remove image">X</button>' : '';
  document.getElementById(wrapId).innerHTML='<img class="preview-img" src="'+src+'" style="max-width:100%;max-height:140px;object-fit:contain"/>'+clearBtn;
}
function clearImage(target) {
  if(target==='cover'){
    coverImageData=null; coverImageFile=null; stegoResultCanvas=null;
    resetFileInput('cover-file-input');
    resetDropZone('cover-preview-wrap','&#8679;','Drag and drop PNG/JPG','MAX: 12MB');
    document.getElementById('img-compare').style.display='none';
    document.getElementById('stego-placeholder').style.display='';
    document.getElementById('stego-metrics').style.display='none';
    document.getElementById('stego-histogram-panel').style.display='none';
    document.getElementById('stego-preview').src='';
    document.getElementById('stego-preview').style.opacity='0.3';
    document.getElementById('orig-preview').src='';
    document.getElementById('stego-badge').style.display='none';
    document.getElementById('stego-download-btn').style.display='none';
    showToast('Cover image removed.','info');
    logStego('COVER IMAGE REMOVED.', 'warn');
  } else if(target==='dual'){
    dualImageData=null; dualImageFile=null; dualResultCanvas=null;
    resetFileInput('dual-file-input');
    resetDropZone('dual-preview-wrap','&#8679;','Drag and drop cover image','PNG / JPG recommended');
    document.getElementById('dual-result-section').style.display='none';
    document.getElementById('dual-download-btn').style.display='none';
    document.getElementById('dual-image-result').style.display='none';
    document.getElementById('dual-metrics').style.display='none';
    document.getElementById('dual-histogram-panel').style.display='none';
    showToast('Cover image removed.','info');
  } else if(target==='vault'){
    vaultImageData=null; vaultImageFile=null;
    resetFileInput('vault-file-input');
    resetDropZone('vault-preview-wrap','&#128274;','Upload Vault PNG','Must be exported from Dual-Lock Encode');
    document.getElementById('dual-result-section').style.display='none';
    showToast('Vault image removed.','info');
  }
}

// LSB
var EOF_DELIMITER = '1111111111111110';
function seededShuffle(arr, seed) {
  var s=seed;
  var rand=function(){ s=(s*1664525+1013904223)&0xffffffff; return (s>>>0)/0xffffffff; };
  for(var i=arr.length-1;i>0;i--){ var j=Math.floor(rand()*(i+1)); var tmp=arr[i]; arr[i]=arr[j]; arr[j]=tmp; }
  return arr;
}
function lsbEmbed(imgData, message, key, useRandom, useXor) {
  var msg = useXor ? xorCipher(message,key) : message;
  var binary='';
  for(var i=0;i<msg.length;i++) binary+=msg.charCodeAt(i).toString(2).padStart(8,'0');
  binary+=EOF_DELIMITER;
  var data=new Uint8ClampedArray(imgData.data);
  if(binary.length>data.length) throw new Error('Data too large. Need '+binary.length+' bits, capacity '+data.length+' bits.');
  var indices=Array.from({length:data.length},function(_,i){return i;});
  if(useRandom){ var seed=key?[...key].reduce(function(a,c){return a+c.charCodeAt(0);},0):42; seededShuffle(indices,seed); }
  for(var i=0;i<binary.length;i++){ var idx=indices[i]; data[idx]=(data[idx]&0xFE)|parseInt(binary[i]); }
  return new ImageData(data,imgData.width,imgData.height);
}
function lsbExtract(imgData, key, useRandom, useXor) {
  var data=imgData.data, total=data.length;
  var indices=Array.from({length:total},function(_,i){return i;});
  if(useRandom){ var seed=key?[...key].reduce(function(a,c){return a+c.charCodeAt(0);},0):42; seededShuffle(indices,seed); }
  var bits=[];
  var tail='';
  var found=false;
  for(var i=0;i<total;i++){
    var bit=String(data[indices[i]]&1);
    bits.push(bit);
    tail+=bit;
    if(tail.length>16) tail=tail.slice(-16);
    if(tail.length===16&&tail===EOF_DELIMITER){ bits=bits.slice(0,-16); found=true; break; }
  }
  if(!found||bits.length===0||bits.length%8!==0) return '[Error] Delimiter not found. Wrong image or key.';
  var result='';
  for(var i=0;i<bits.length;i+=8) result+=String.fromCharCode(parseInt(bits.slice(i,i+8).join(''),2));
  return useXor ? xorCipher(result,key) : result;
}
function calculateMetrics(orig, stego) {
  var d1=orig.data,d2=stego.data,mse=0;
  for(var i=0;i<d1.length;i++) mse+=(d1[i]-d2[i])*(d1[i]-d2[i]);
  mse/=d1.length;
  var psnr=mse===0?100:10*Math.log10((255*255)/mse);
  var mu1=0,mu2=0;
  for(var i=0;i<d1.length;i++){mu1+=d1[i];mu2+=d2[i];}
  mu1/=d1.length; mu2/=d2.length;
  var s1=0,s2=0,s12=0;
  for(var i=0;i<d1.length;i++){s1+=(d1[i]-mu1)*(d1[i]-mu1);s2+=(d2[i]-mu2)*(d2[i]-mu2);s12+=(d1[i]-mu1)*(d2[i]-mu2);}
  s1=Math.sqrt(s1/d1.length);s2=Math.sqrt(s2/d1.length);s12=s12/d1.length;
  var C1=6.5025,C2=58.5225;
  var ssim=((2*mu1*mu2+C1)*(2*s12+C2))/((mu1*mu1+mu2*mu2+C1)*(s1*s1+s2*s2+C2));
  return {mse:mse.toFixed(5),psnr:psnr.toFixed(2),ssim:Math.min(1,Math.abs(ssim)).toFixed(6)};
}

// HISTOGRAM COMPARISON
function computeChannelHistograms(imgData) {
  var d=imgData.data;
  var r=new Array(256).fill(0), g=new Array(256).fill(0), b=new Array(256).fill(0);
  for(var i=0;i<d.length;i+=4){ r[d[i]]++; g[d[i+1]]++; b[d[i+2]]++; }
  return {r:r,g:g,b:b};
}
function niceCeilStep(value) {
  if(value<=0) return 1;
  var exp=Math.floor(Math.log10(value));
  var mag=Math.pow(10,exp);
  var residual=value/mag;
  var nice;
  if(residual<=1.5) nice=1; else if(residual<=3.5) nice=2; else if(residual<=7.5) nice=5; else nice=10;
  return nice*mag;
}
function formatTickValue(v) {
  if(v>=1000){
    var k=v/1000;
    return (k%1===0?k:k.toFixed(1))+'K';
  }
  if(v>0 && v%1!==0) return v.toFixed(2);
  return String(Math.round(v));
}
function drawHistogramCanvas(canvas, hist, color, titleText) {
  var ctx=canvas.getContext('2d');
  var dpr=window.devicePixelRatio||1;
  var cssW=canvas.clientWidth||canvas.width, cssH=canvas.clientHeight||canvas.height;
  canvas.width=cssW*dpr; canvas.height=cssH*dpr;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  var w=cssW, h=cssH;
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle='rgba(255,255,255,0.015)';
  ctx.fillRect(0,0,w,h);

  var padL=58, padB=42, padT=26, padR=16;
  var plotW=w-padL-padR, plotH=h-padT-padB;

  var maxVal=0; for(var i=0;i<256;i++) if(hist[i]>maxVal) maxVal=hist[i];
  if(maxVal===0) maxVal=1;
  var step=niceCeilStep(maxVal/4);
  var yTicks=[]; for(var t=0;t*step<=maxVal+step*0.001;t++) yTicks.push(t*step);
  if(yTicks.length<2) yTicks.push(step);
  var scaleMax=Math.max(maxVal,yTicks[yTicks.length-1])*1.04;

  // chart title (inside canvas, like reference image)
  ctx.fillStyle=color;
  ctx.font='bold 12px "JetBrains Mono", monospace';
  ctx.textAlign='center';
  ctx.fillText(titleText, padL+plotW/2, 16);

  // gridlines (vertical - pixel value ticks)
  var xTicks=[0,50,100,150,200,250];
  ctx.strokeStyle='rgba(0,209,255,0.18)';
  ctx.lineWidth=1;
  xTicks.forEach(function(xv){
    var x=padL+(plotW*xv/255);
    ctx.beginPath(); ctx.moveTo(x,padT); ctx.lineTo(x,padT+plotH); ctx.stroke();
  });
  // gridlines (horizontal - frequency ticks)
  yTicks.forEach(function(yv){
    var y=padT+plotH-(yv/scaleMax)*plotH;
    ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(padL+plotW,y); ctx.stroke();
  });

  // axes
  ctx.strokeStyle='rgba(255,255,255,0.3)';
  ctx.lineWidth=1.2;
  ctx.beginPath(); ctx.moveTo(padL,padT); ctx.lineTo(padL,padT+plotH); ctx.lineTo(padL+plotW,padT+plotH); ctx.stroke();

  // y tick labels (compact "K" notation prevents overlap with the rotated axis title)
  ctx.fillStyle='rgba(255,255,255,0.55)';
  ctx.font='10px "JetBrains Mono", monospace';
  ctx.textAlign='right';
  ctx.textBaseline='middle';
  yTicks.forEach(function(yv){
    var y=padT+plotH-(yv/scaleMax)*plotH;
    ctx.fillText(formatTickValue(yv),padL-8,y);
  });

  // x tick labels
  ctx.textAlign='center';
  ctx.textBaseline='alphabetic';
  xTicks.forEach(function(xv){
    var x=padL+(plotW*xv/255);
    ctx.fillText(String(xv),x,padT+plotH+16);
  });

  // axis titles
  ctx.fillStyle='rgba(255,255,255,0.4)';
  ctx.font='10px "JetBrains Mono", monospace';
  ctx.textAlign='center';
  ctx.fillText('PIXEL VALUE', padL+plotW/2, h-6);
  ctx.save();
  ctx.translate(14,padT+plotH/2);
  ctx.rotate(-Math.PI/2);
  ctx.fillText('FREQUENCY',0,0);
  ctx.restore();

  // histogram curve
  ctx.beginPath();
  for(var i=0;i<256;i++){
    var x=padL+(plotW*i/255);
    var y=padT+plotH-(hist[i]/scaleMax)*plotH;
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.strokeStyle=color; ctx.lineWidth=1.6; ctx.lineJoin='round'; ctx.stroke();
  ctx.lineTo(padL+plotW,padT+plotH); ctx.lineTo(padL,padT+plotH); ctx.closePath();
  ctx.globalAlpha=0.14; ctx.fillStyle=color; ctx.fill(); ctx.globalAlpha=1;
}
function renderHistogramComparison(origImgData, stegoImgData, containerId, panelId) {
  var container=document.getElementById(containerId);
  if(!container) return;
  if(panelId) document.getElementById(panelId).style.display='';
  container.innerHTML='';
  var origHist=computeChannelHistograms(origImgData);
  var stegoHist=computeChannelHistograms(stegoImgData);
  var rows=[{title:'Original',hist:origHist},{title:'Steganography',hist:stegoHist}];
  var channels=[{key:'r',color:'#FF4141',label:'Channel R'},{key:'g',color:'#00FF41',label:'Channel G'},{key:'b',color:'#00D1FF',label:'Channel B'}];
  rows.forEach(function(row){
    channels.forEach(function(ch){
      var cell=document.createElement('div');
      cell.className='hist-cell';
      var canvas=document.createElement('canvas');
      canvas.className='hist-canvas';
      cell.appendChild(canvas);
      container.appendChild(cell);
      drawHistogramCanvas(canvas, row.hist[ch.key], ch.color, row.title+' - '+ch.label);
    });
  });
}
function executeStego() {
  if(currentStegoMode==='embed'){
    if(!coverImageData){showToast('Upload a cover image first.','error');logStego('ERROR: NO COVER IMAGE LOADED.','error');return;}
    var msg=document.getElementById('stego-input').value;
    if(!msg){showToast('Enter secret payload.','error');logStego('ERROR: PAYLOAD EMPTY.','error');return;}
    var method=document.getElementById('lsb-method').value;
    var useXor=document.getElementById('use-xor').checked;
    var key=document.getElementById('stego-key').value;
    if((method==='random'||useXor)&&!key){showToast('Key/seed required for Random/XOR mode.','error');logStego('ERROR: KEY/SEED REQUIRED.','error');return;}
    logStego('INITIATING EMBED -> METHOD: '+method.toUpperCase()+(useXor?' + XOR':'')+'.');
    try {
      var t0=performance.now();
      var stegoData=lsbEmbed(coverImageData,msg,key,method==='random',useXor);
      var elapsed=(performance.now()-t0).toFixed(1);
      var m=calculateMetrics(coverImageData,stegoData);
      document.getElementById('mse-val').textContent=m.mse;
      document.getElementById('psnr-val').textContent=m.psnr+' dB';
      document.getElementById('ssim-val').textContent=m.ssim;
      document.getElementById('stego-metrics').style.display='grid';
      var canvas=document.createElement('canvas');
      canvas.width=stegoData.width; canvas.height=stegoData.height;
      canvas.getContext('2d').putImageData(stegoData,0,0);
      stegoResultCanvas=canvas;
      document.getElementById('stego-preview').src=canvas.toDataURL('image/png');
      document.getElementById('stego-preview').style.opacity='1';
      document.getElementById('stego-badge').style.display='inline-block';
      document.getElementById('stego-download-btn').style.display='';
      renderHistogramComparison(coverImageData, stegoData, 'stego-histogram', 'stego-histogram-panel');
      logStego('EMBEDDING COMPLETE. ELAPSED: '+elapsed+'ms | PSNR: '+m.psnr+'dB | SSIM: '+m.ssim+'.');
      showToast('Embedding complete in '+elapsed+'ms. PSNR: '+m.psnr+'dB','success');
    } catch(e){showToast(e.message,'error');logStego('ERROR: '+e.message,'error');}
  } else {
    if(!coverImageData){showToast('Upload a stego image first.','error');logStego('ERROR: NO STEGO IMAGE LOADED.','error');return;}
    var method=document.getElementById('lsb-method').value;
    var useXor=document.getElementById('use-xor').checked;
    var key=document.getElementById('stego-key').value;
    logStego('INITIATING EXTRACTION -> METHOD: '+method.toUpperCase()+(useXor?' + XOR':'')+'.');
    try {
      var extracted=lsbExtract(coverImageData,key,method==='random',useXor);
      var et=document.getElementById('extract-result-text');
      et.textContent=extracted; et.style.opacity='1';
      if(extracted.startsWith('[Error]')){ showToast(extracted,'error'); logStego(extracted,'error'); }
      else { showToast('Extraction complete.','success'); logStego('EXTRACTION COMPLETE. LENGTH: '+extracted.length+' CHARS.'); }
    } catch(e){showToast(e.message,'error');logStego('ERROR: '+e.message,'error');}
  }
}
function downloadStegoImage() {
  if(!stegoResultCanvas) return;
  var a=document.createElement('a'); a.download='stego_result.png'; a.href=stegoResultCanvas.toDataURL('image/png'); a.click();
  logStego('VAULT IMAGE EXPORTED: stego_result.png');
}

// DUAL-LOCK
function setDualMode(mode) {
  currentDualMode=mode;
  document.getElementById('dual-encode-btn').classList.toggle('active-mode',mode==='encode');
  document.getElementById('dual-decode-btn').classList.toggle('active-mode',mode==='decode');
  document.getElementById('dual-plaintext-panel').style.display=mode==='encode'?'':'none';
  document.getElementById('dual-cover-panel').style.display=mode==='encode'?'':'none';
  document.getElementById('dual-stego-upload-panel').style.display=mode==='decode'?'':'none';
  document.getElementById('key-strength-wrap').style.display=mode==='encode'?'':'none';
  document.getElementById('dual-action-btn').textContent=mode==='encode'?'EXECUTE DUAL-LOCK ENCODE':'EXECUTE DUAL-LOCK DECODE';
  document.getElementById('dual-download-btn').style.display='none';
  document.getElementById('dual-result-section').style.display='none';
  logDual('MODE SWITCH -> '+mode.toUpperCase()+' PIPELINE SELECTED.','info');
}
function logDual(msg, cls) {
  cls=cls||'';
  var t=new Date();
  var ts='['+pad(t.getHours())+':'+pad(t.getMinutes())+':'+pad(t.getSeconds())+']';
  var term=document.getElementById('dual-terminal');
  var line=document.createElement('div'); line.className='log-line';
  line.innerHTML='<span class="log-time">'+ts+'</span><span class="log-text '+cls+'">'+msg+'</span>';
  term.appendChild(line); term.scrollTop=term.scrollHeight;
}
function updateEntropy() {
  var v=document.getElementById('dual-password').value, score=0;
  if(v.length>6) score+=20; if(v.length>12) score+=20;
  if(/[A-Z]/.test(v)) score+=20; if(/[0-9]/.test(v)) score+=20; if(/[^a-zA-Z0-9]/.test(v)) score+=20;
  document.getElementById('entropy-bar').style.width=score+'%';
}
async function executeDual() {
  var password=document.getElementById('dual-password').value;
  if(!password){showToast('Master password required.','error');return;}
  var loading=document.getElementById('dual-loading'), progress=document.getElementById('dual-progress');
  loading.classList.add('show');
  document.getElementById('pipeline-status').textContent='STATUS: PROCESSING';
  document.getElementById('pipeline-status').className='pipeline-status processing';
  var ap=function(pct,delay){ return new Promise(function(r){setTimeout(function(){progress.style.width=pct+'%';r();},delay);}); };
  if(currentDualMode==='encode'){
    var plaintext=document.getElementById('dual-plaintext').value;
    if(!plaintext){loading.classList.remove('show');showToast('Enter plaintext message.','error');return;}
    if(!dualImageData){loading.classList.remove('show');showToast('Upload a cover image.','error');return;}
    logDual('INITIATING DUAL-LOCK ENCODE SEQUENCE...');
    await ap(15,100); logDual('LAYER 01 -> DERIVING AES-256 KEY FROM MASTER PASSWORD...','info');
    await ap(30,400);
    var ciphertext=await aesEncrypt(plaintext,password);
    logDual('LAYER 01 -> AES-256 ENCRYPTION COMPLETE. OUTPUT: '+ciphertext.length+' CHARS.');
    await ap(55,300); logDual('LAYER 02 -> INITIATING RANDOM LSB PIXEL INJECTION...','info');
    await ap(75,400);
    try {
      var stegoData=lsbEmbed(dualImageData,ciphertext,password,true,false);
      await ap(90,300);
      var m=calculateMetrics(dualImageData,stegoData);
      logDual('LAYER 02 -> EMBEDDING COMPLETE. PSNR: '+m.psnr+'dB | SSIM: '+m.ssim);
      await ap(100,200);
      var canvas=document.createElement('canvas'); canvas.width=stegoData.width; canvas.height=stegoData.height;
      canvas.getContext('2d').putImageData(stegoData,0,0); dualResultCanvas=canvas;
      document.getElementById('dual-result-img').src=canvas.toDataURL('image/png');
      document.getElementById('d-mse').textContent=m.mse;
      document.getElementById('d-psnr').textContent=m.psnr+' dB';
      document.getElementById('d-ssim').textContent=m.ssim;
      document.getElementById('dual-metrics').style.display='grid';
      document.getElementById('dual-result').style.display='none';
      document.getElementById('dual-image-result').style.display='';
      document.getElementById('dual-result-section').style.display='';
      document.getElementById('dual-download-btn').style.display='';
      renderHistogramComparison(dualImageData, stegoData, 'dual-histogram', 'dual-histogram-panel');
      logDual('DUAL-LOCK ENCODE PIPELINE: SUCCESS');
      showToast('Dual-Lock encoding complete!','success');
    } catch(e){ logDual('ERROR: '+e.message,'error'); showToast(e.message,'error'); }
  } else {
    if(!vaultImageData){loading.classList.remove('show');showToast('Upload the vault PNG.','error');return;}
    logDual('INITIATING DUAL-LOCK DECODE SEQUENCE...');
    await ap(20,200); logDual('LAYER 02 REVERSED -> EXTRACTING LSB PAYLOAD...','info');
    await ap(50,500);
    var extracted=lsbExtract(vaultImageData,password,true,false);
    await ap(70,300);
    if(extracted.startsWith('[Error]')){
      logDual(extracted,'error'); loading.classList.remove('show'); showToast(extracted,'error');
      var ps=document.getElementById('pipeline-status');
      ps.textContent='STATUS: ERROR'; ps.className='pipeline-status'; ps.style.color='var(--red)'; return;
    }
    logDual('LAYER 02 REVERSED -> CIPHERTEXT RECOVERED. LENGTH: '+extracted.length);
    await ap(80,200); logDual('LAYER 01 REVERSED -> AES-256 DECRYPTION...','info');
    var plaintext=await aesDecrypt(extracted,password);
    await ap(100,300);
    logDual('LAYER 01 REVERSED -> DECRYPTION COMPLETE.');
    var dt=document.getElementById('dual-result-text'); dt.textContent=plaintext;
    document.getElementById('dual-result').style.display='';
    document.getElementById('dual-image-result').style.display='none';
    document.getElementById('dual-metrics').style.display='none';
    document.getElementById('dual-histogram-panel').style.display='none';
    document.getElementById('dual-result-section').style.display='';
    logDual('DUAL-LOCK DECODE PIPELINE: SUCCESS');
    showToast('Message successfully recovered!','success');
  }
  setTimeout(function(){
    loading.classList.remove('show');
    var ps=document.getElementById('pipeline-status');
    ps.textContent='STATUS: COMPLETE'; ps.className='pipeline-status ready';
  },400);
}
function downloadDualImage() {
  if(!dualResultCanvas) return;
  var a=document.createElement('a'); a.download='hideit_vault.png'; a.href=dualResultCanvas.toDataURL('image/png'); a.click();
}

// INIT
setInterval(function(){ document.getElementById('sb-latency').textContent=(Math.random()*8+2).toFixed(1)+'MS'; },3000);

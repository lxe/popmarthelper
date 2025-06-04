(function() {
  // === CLEANUP FUNCTION ===
  function cleanupScript() {
    console.log('🧹 Running cleanup...');
    
    // Remove existing overlay if present
    const existingOverlay = document.querySelector('[data-popmart-helper="true"]');
    if (existingOverlay) {
      console.log('🗑️ Removing overlay');
      existingOverlay.remove();
    }
    
    // Stop any existing script
    if (window.popmartHelper) {
      console.log('🛑 Stopping script instance');
      if (window.popmartHelper.isRunning) {
        window.popmartHelper.isRunning = false;
      }
      
      // Clear any existing intervals
      if (window.popmartHelper.urlCheckInterval) {
        clearInterval(window.popmartHelper.urlCheckInterval);
      }
      
      // Restore original XMLHttpRequest methods if they were overridden
      if (window.popmartHelper.originalXHR) {
        XMLHttpRequest.prototype.open = window.popmartHelper.originalXHR.open;
        XMLHttpRequest.prototype.send = window.popmartHelper.originalXHR.send;
        console.log('🔧 Restored original XMLHttpRequest methods');
      }
      
      // Restore original history methods if they were overridden
      if (window.popmartHelper.originalHistory) {
        history.pushState = window.popmartHelper.originalHistory.pushState;
        history.replaceState = window.popmartHelper.originalHistory.replaceState;
        console.log('🔧 Restored original history methods');
      }
      
      // Clear global state
      window.popmartHelper = null;
    }
    
    console.log('✅ Cleanup complete');
  }

  // === INITIALIZATION ===
  console.log('🔄 Initializing POP MART Helper (re-entrant)...');
  
  // Run cleanup first
  cleanupScript();
  
  // Initialize global state object
  window.popmartHelper = {
    isRunning: false,
    isWaitingForStock: false,
    setRecords: {},
    lastSetNo: null,
    currentUrl: window.location.href,
    urlCheckInterval: null,
    activeTimeouts: [],
    originalXHR: {
      open: XMLHttpRequest.prototype.open,
      send: XMLHttpRequest.prototype.send
    },
    originalHistory: {
      pushState: history.pushState,
      replaceState: history.replaceState
    },
    cleanup: cleanupScript
  };
  
  console.log('✅ Fresh initialization complete');

  // Helper to find elements by class prefix
  function findByClassPrefix(prefix, root = document) {
    return Array.from(root.querySelectorAll('*')).filter(el =>
      Array.from(el.classList).some(cls => cls.startsWith(prefix))
    );
  }

  // Helper to check if element is truly visible
  function isElementVisible(element) {
    if (!element) return false;
    
    const style = getComputedStyle(element);
    
    // Check basic visibility properties
    if (style.display === 'none' || 
        style.visibility === 'hidden' || 
        style.opacity === '0') {
      return false;
    }
    
    // Check if element has dimensions
    if (element.offsetWidth === 0 || element.offsetHeight === 0) {
      return false;
    }
    
    // Check if element is in viewport (at least partially)
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;
    
    return (rect.bottom > 0 && 
            rect.right > 0 && 
            rect.top < windowHeight && 
            rect.left < windowWidth);
  }

  // === URL Change Detection and Style Proxy Setup ===
  let currentUrl = window.popmartHelper.currentUrl;
  
  function setupStyleProxy() {
    // console.log('🔧 Setting up style proxy for URL:', window.location.href);
    
    const container = document.getElementById('chooseSmallBoxContainer');
    if (!container) {
      // console.log('⚠️ chooseSmallBoxContainer not found, retrying in 500ms...');
      setTimeout(setupStyleProxy, 500);
      return;
    }
    
    const thirdDiv = container.querySelector('div:nth-child(3)');
    if (!thirdDiv) {
      // console.log('⚠️ Third div not found, retrying in 500ms...');
      setTimeout(setupStyleProxy, 500);
      return;
    }

    // Check if proxy is already set up
    if (thirdDiv._proxySetup) {
      // console.log('✅ Style proxy already set up for this element');
      return;
    }

    // Block direct style changes
    const styleHandler = {
      set(target, prop, value) {
        if (prop === 'transition' || prop === 'webkitTransition' && value !== 'none') {
          // console.log('Blocked style change on third div:', prop, value);
          target[prop] = '0.001s';
        } else {
          target[prop] = value;
        }
        return true;
      }
    };
    const proxy = new Proxy(thirdDiv.style, styleHandler);

    Object.defineProperty(thirdDiv, 'style', {
      get() { return proxy; },
      configurable: true  // Allow reconfiguration if needed
    });
    
    // Mark this element as having proxy setup
    thirdDiv._proxySetup = true;
    // console.log('✅ Style proxy established for third div');
  }

  function detectUrlChange() {
    if (window.location.href !== currentUrl) {
      console.log('🔄 URL changed from', currentUrl, 'to', window.location.href);
      currentUrl = window.location.href;
      window.popmartHelper.currentUrl = currentUrl;
      
      // Update UI elements when URL changes
      updateProductPageLink();
      updateToggleButtonState();
      
      // Check if we've left a product page and stop script if running
      if (window.popmartHelper.isRunning && !isOnProductPage()) {
        console.log('📍 Left product page - stopping script');
        stopAllScriptActivity();
      }
      
      // Check if we've reached the box page
      if (currentUrl.includes('/us/pop-now/box/')) {
        console.log('🎯 Reached box page - stopping loop and preparing to add to bag');
        window.popmartHelper.isRunning = false; // Stop the loop
        
        // Wait 1 second then click ADD TO BAG button
        const timeoutId = setTimeout(() => {
          findAndClickAddToBag();
        }, 1000);
        trackTimeout(timeoutId);
        
        return; // Don't setup proxy on box page
      }
      
      // Wait a bit for DOM to update, then setup proxy
      const timeoutId = setTimeout(setupStyleProxy, 200);
      trackTimeout(timeoutId);
    }
  }

  function findAndClickAddToBag() {
    const addToBagBtn = Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent && btn.textContent.includes('ADD TO BAG')
    );
    
    if (addToBagBtn) {
      console.log('🛒 Clicking ADD TO BAG button - polling for confirmation');
      highlightElement(addToBagBtn, 2000);
      syntheticClick(addToBagBtn);
      
      // After clicking ADD TO BAG, start polling for confirmation button
      pollForConfirmButton();
    } else {
      console.log('❌ ADD TO BAG button not found, retrying in 500ms...');
      const timeoutId = setTimeout(findAndClickAddToBag, 500);
      trackTimeout(timeoutId);
    }
  }

  function pollForConfirmButton() {
    console.log('🔍 Polling for confirmation button...');
    
    // Look for element with class prefix 'index_seeConfirmBtn'
    const confirmBtn = findByClassPrefix('index_seeConfirmBtn').find(el => isElementVisible(el));
    
    if (confirmBtn) {
      console.log('✅ Found confirmation button - clicking it');
      highlightElement(confirmBtn, 2000);
      syntheticClick(confirmBtn);
      
      // Stop the script after clicking confirmation
      console.log('🏁 Confirmation clicked - stopping script');
      stopAllScriptActivity();
    } else {
      console.log('⏳ Confirmation button not visible yet, retrying in 200ms...');
      const timeoutId = setTimeout(pollForConfirmButton, 200);
      trackTimeout(timeoutId);
    }
  }

  // Set up URL change detection
  const originalPushState = window.popmartHelper.originalHistory.pushState;
  const originalReplaceState = window.popmartHelper.originalHistory.replaceState;
  
  history.pushState = function() {
    originalPushState.apply(history, arguments);
    setTimeout(detectUrlChange, 100);
  };
  
  history.replaceState = function() {
    originalReplaceState.apply(history, arguments);
    setTimeout(detectUrlChange, 100);
  };
  
  window.addEventListener('popstate', () => {
    setTimeout(detectUrlChange, 100);
  });
  
  // Also check periodically for any missed URL changes
  window.popmartHelper.urlCheckInterval = setInterval(detectUrlChange, 1000);

  // Initial setup
  setupStyleProxy();

  // === 2️⃣ Helper UI and logic ===
  const overlay = document.createElement('div');
  overlay.setAttribute('data-popmart-helper', 'true'); // Mark for cleanup
  overlay.style = `
    position: fixed; bottom: 0; left: 0; right: 0; width: 100%;
    background: rgba(28,28,28,0.85); color: #f0f0f0; padding: 16px;
    z-index: 9999; font-family: monospace; font-size: 13px;
    box-shadow: 0 -4px 20px rgba(0,0,0,0.3); line-height: 1.5;
    backdrop-filter: blur(8px); max-height: 50vh; overflow-y: auto;
  `;
  overlay.innerHTML = `
    <div style="font-size:16px; font-weight:bold; margin-bottom:10px; color:#fff; display:flex; justify-content:space-between; align-items:center;">
      <span>POP MART Helper${window.POP_MART_HELPER_VERSION ? ' ' + window.POP_MART_HELPER_VERSION : ''} - Set Tracker</span>
      <button id="closeBtn" style="background:transparent; border:none; color:#fff; font-size:18px; cursor:pointer; padding:0; width:20px; height:20px; display:flex; align-items:center; justify-content:center;" title="Close and cleanup">×</button>
    </div>
    <div style="margin-bottom:12px;">
      <a id="productPageLink" href="#" style="color:#4da6ff; text-decoration:none; font-size:12px; display:block; margin-bottom:8px;" title="Go to product page">📦 Product Page</a>
    </div>
    <div style="display:flex; gap:6px; margin-bottom:12px;">
      <label>Base Delay (ms):
        <input id="baseDelayInput" type="number" value="500" style="width:60px; color:black;">
      </label>
      <label>Jitter (ms):
        <input id="jitterInput" type="number" value="100" style="width:60px; color:black;">
      </label>
    </div>
    <div style="display:flex; gap:8px; margin-bottom:12px; flex-wrap:wrap;">
      <button id="toggleBtn">Start</button>
      <button id="resetBtn">Reset</button>
      <button id="waitStockBtn">Wait Until In Stock</button>
      <button id="setVisualizerToggle">Hide Sets</button>
      <button id="jsonToggle" style="font-weight:bold; color:black; background:white;
        border:none; padding:6px 12px; border-radius:6px; cursor:pointer;
        box-shadow:0 2px 4px rgba(0,0,0,0.2);">Toggle JSON</button>
    </div>
    <pre id="jsonViewer" style="background:#111; padding:10px; border-radius:8px;
      color:#0f0; white-space:pre-wrap; word-break:break-word; overflow-x:auto;
      max-height:200px; overflow-y:auto; display:none;"></pre>
    <div id="patternAnalysis" style="margin-bottom:10px;"></div>
    <div id="setContainer" style="display:flex; flex-wrap:wrap; gap:8px; max-height:200px; overflow-y:auto; padding:4px; border:1px solid #444; border-radius:6px; background:rgba(0,0,0,0.2);"></div>
    <div id="totalSets" style="margin-top:10px; font-weight:bold;"></div>
  `;
  document.body.appendChild(overlay);

  // Style the control buttons
  ['toggleBtn', 'resetBtn', 'waitStockBtn', 'setVisualizerToggle', 'jsonToggle'].forEach(id => {
    const btn = document.getElementById(id);
    btn.style = `
      font-weight: bold; color: black; background: white; border: none;
      padding: 6px 12px; border-radius: 6px; cursor: pointer;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    `;
  });

  // Wire up the close button
  document.getElementById('closeBtn').onclick = () => {
    console.log('🗑️ Close button clicked');
    window.popmartHelper.cleanup();
  };

  const jsonToggle = document.getElementById('jsonToggle');
  const jsonViewer = document.getElementById('jsonViewer');
  const setContainer = document.getElementById('setContainer');
  const totalSetsDisplay = document.getElementById('totalSets');
  let isRunning = window.popmartHelper.isRunning;
  let setRecords = window.popmartHelper.setRecords;
  let lastSetNo = window.popmartHelper.lastSetNo;

  // Generate URL-specific localStorage key
  function getStorageKey() {
    return `popmart_set_records_${window.location.origin}${window.location.pathname}`;
  }

  try {
    const saved = localStorage.getItem(getStorageKey());
    if (saved) {
      setRecords = JSON.parse(saved);
      window.popmartHelper.setRecords = setRecords;
    }
  } catch (e) {
    console.warn('Failed to parse saved set records:', e);
  }

  jsonToggle.onclick = () => {
    jsonViewer.style.display = (jsonViewer.style.display === 'none') ? 'block' : 'none';
  };

  // Set visualizer toggle functionality
  const setVisualizerToggle = document.getElementById('setVisualizerToggle');
  const setVisualizerContainer = document.getElementById('setContainer');
  const totalSetsContainer = document.getElementById('totalSets');
  
  setVisualizerToggle.onclick = () => {
    const isVisible = setVisualizerContainer.style.display !== 'none';
    
    if (isVisible) {
      // Hide the sets but keep pattern analysis visible
      setVisualizerContainer.style.display = 'none';
      totalSetsContainer.style.display = 'none';
      setVisualizerToggle.textContent = 'Show Sets';
      console.log('📦 Set visualizer hidden (pattern analysis remains visible)');
    } else {
      // Show the sets
      setVisualizerContainer.style.display = 'flex';
      totalSetsContainer.style.display = 'block';
      setVisualizerToggle.textContent = 'Hide Sets';
      console.log('📦 Set visualizer shown');
    }
  };

  document.getElementById('resetBtn').onclick = () => {
    setRecords = {};
    lastSetNo = null;
    window.popmartHelper.setRecords = {};
    window.popmartHelper.lastSetNo = null;
    localStorage.removeItem(getStorageKey());
    updateSetGrid();
    updatePatternAnalysis();
    console.log('Set records and localStorage cleared.');
  };

  function updateSetGrid() {
    setContainer.innerHTML = '';
    const entries = Object.entries(setRecords);
    totalSetsDisplay.textContent = `Total Sets: ${entries.length}`;

    // Sort by middle number (highest to lowest) for better interval analysis
    entries.sort(([a], [b]) => {
      const middleA = extractMiddleNumber(a);
      const middleB = extractMiddleNumber(b);
      if (middleA !== null && middleB !== null) {
        return middleB - middleA; // Highest to lowest
      }
      // Fallback to string comparison if extraction fails
      return b.localeCompare(a);
    }).forEach(([setNo, data]) => {
      const setDiv = document.createElement('div');
      const isRecent = setNo === lastSetNo;
      const timeSinceDiscovered = data.firstDiscovered ? Date.now() - data.firstDiscovered : 0;
      const hoursAgo = Math.floor(timeSinceDiscovered / (1000 * 60 * 60));
      const minutesAgo = Math.floor((timeSinceDiscovered % (1000 * 60 * 60)) / (1000 * 60));
      
      let timeDisplay = '';
      if (data.firstDiscovered) {
        if (hoursAgo > 0) {
          timeDisplay = `${hoursAgo}h ago`;
        } else if (minutesAgo > 0) {
          timeDisplay = `${minutesAgo}m ago`;
        } else {
          timeDisplay = 'Just now';
        }
      }
      
      // Extract middle number and create highlighted title
      const middleNumber = extractMiddleNumber(setNo);
      let displayTitle = setNo;
      if (middleNumber) {
        // Highlight the middle number in the title
        const middleStr = middleNumber.toString().padStart(5, '0');
        const beforeMiddle = setNo.substring(0, 4);
        const afterMiddle = setNo.substring(9);
        displayTitle = `${beforeMiddle}<span style="background:#ff0; color:#000; padding:0 2px; border-radius:2px;">${middleStr}</span>${afterMiddle}`;
      }
      
      // Generate URL for this set
      const setUrl = generateNextProductUrl(setNo);
      
      setDiv.style = `
        border-radius: 6px; background: ${isRecent ? '#ff0' : '#333'};
        color: ${isRecent ? '#000' : '#fff'}; padding: 4px; font-size: 10px;
        border-left: ${isRecent ? '3px solid #f00' : 'none'};
        cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;
      `;
      
      // Add hover effect
      setDiv.addEventListener('mouseenter', () => {
        setDiv.style.transform = 'scale(1.05)';
        setDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      });
      
      setDiv.addEventListener('mouseleave', () => {
        setDiv.style.transform = 'scale(1)';
        setDiv.style.boxShadow = 'none';
      });
      
      // Make it clickable to open in new tab
      setDiv.addEventListener('click', () => {
        console.log(`🔗 Opening set ${setNo} in new tab: ${setUrl}`);
        window.open(setUrl, '_blank');
      });
      
      setDiv.innerHTML = `
        <div>${displayTitle}</div>
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:9px;">
          <span>x${data.count}</span>
          <span style="font-size:8px; opacity:0.7;">${timeDisplay}</span>
        </div>
        <div style="display:flex; gap:2px; margin-top:2px;">
          ${data.box_list.map(box => `
            <div style="
              width:10px; height:10px; border-radius:2px;
              background:${boxStateColor(box.state)};
            "></div>
          `).join('')}
        </div>
      `;
      setContainer.appendChild(setDiv);
    });

    updatePatternAnalysis();
  }

  function updatePatternAnalysis() {
    const patternContainer = document.getElementById('patternAnalysis');
    patternContainer.innerHTML = '';

    const analysis = analyzeSetIntervals();
    if (analysis) {
      const analysisDiv = document.createElement('div');
      analysisDiv.style = `
        background: #1a1a1a; color: #4da6ff; padding: 8px; border-radius: 6px;
        font-size: 10px; border: 1px solid #4da6ff;
      `;
      
      // Generate links for missing IDs (limit to first 10 to avoid overwhelming UI)
      const missingIds = analysis.allIdsInRange.filter(item => !item.discovered);
      const displayCount = Math.min(10, missingIds.length);
      const linksHtml = missingIds.slice(0, displayCount).map(item => {
        const url = generateNextProductUrl(item.id);
        return `<a href="${url}" target="_blank" style="color: #4da6ff; text-decoration: underline; font-size: 8px; margin-right: 8px;">${item.middle}</a>`;
      }).join('');
      
      const moreText = missingIds.length > displayCount ? ` (+${missingIds.length - displayCount} more)` : '';
      
      analysisDiv.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 4px;">📊 Range Analysis</div>
        <div style="margin-bottom: 2px;">Range: ${analysis.lowestMiddle} - ${analysis.highestMiddle} (${analysis.totalRange} total)</div>
        <div style="margin-bottom: 2px;">Discovered: ${analysis.discoveredCount}, Missing: ${analysis.missingCount}</div>
        ${analysis.missingCount > 0 ? `
          <div style="margin-bottom: 4px; font-weight: bold;">Missing IDs:</div>
          <div style="line-height: 1.3;">${linksHtml}${moreText}</div>
        ` : '<div style="color: #0f0;">✅ All IDs in range discovered!</div>'}
      `;
      patternContainer.appendChild(analysisDiv);
    }
  }

  function boxStateColor(state) {
    switch(state) {
      case 0: return '#888';
      case 1: return '#000';
      case 2: return '#888';
      case 3: return '#00f';
      case 4: return '#ff0';
      case 5: return '#0ff';
      default: return '#444';
    }
  }

  // === SET ID PATTERN ANALYSIS ===
  function extractMiddleNumber(setId) {
    // Extract the 5-digit middle number from pattern like 1000[XXXXX]... (positions 4-8)
    // Examples: 10008782500350 → 87825, 10006456200280 → 64562
    if (setId.length >= 9 && setId.startsWith('1000')) {
      const middleStr = setId.substring(4, 9); // Extract positions 4-8 (5 digits)
      const middle = parseInt(middleStr, 10);
      return isNaN(middle) ? null : middle;
    }
    return null;
  }

  function analyzeSetIntervals() {
    console.log('🔍 Starting range analysis...');
    const setIds = Object.keys(setRecords);
    console.log('📊 Available set IDs:', setIds);
    
    if (setIds.length < 1) {
      console.log('❌ No sets available for analysis');
      return null;
    }

    // Extract middle numbers
    const middleNumbers = setIds
      .map(id => {
        const middle = extractMiddleNumber(id);
        console.log(`🔢 Extracting from ${id} → ${middle}`);
        return { id, middle };
      })
      .filter(item => {
        const isValid = item.middle !== null;
        if (!isValid) {
          console.log(`❌ Invalid pattern for ${item.id}`);
        }
        return isValid;
      })
      .sort((a, b) => a.middle - b.middle); // Sort lowest to highest

    console.log('✅ Valid middle numbers (sorted):', middleNumbers);

    if (middleNumbers.length < 1) {
      console.log('❌ No valid patterns for analysis');
      return null;
    }

    // Find range
    const lowestMiddle = middleNumbers[0].middle;
    const highestMiddle = middleNumbers[middleNumbers.length - 1].middle;
    const totalRange = highestMiddle - lowestMiddle + 1;
    const discoveredCount = middleNumbers.length;
    const missingCount = totalRange - discoveredCount;

    console.log(`📏 Range: ${lowestMiddle} to ${highestMiddle} (${totalRange} total)`);
    console.log(`✅ Discovered: ${discoveredCount}, Missing: ${missingCount}`);

    // Generate all IDs in range
    const allIdsInRange = [];
    const templateId = middleNumbers[0].id; // Use first ID as template
    const beforeMiddle = templateId.substring(0, 4); // "1000"
    const afterMiddle = templateId.substring(9); // everything after the 5-digit middle

    for (let middle = lowestMiddle; middle <= highestMiddle; middle++) {
      const generatedId = `${beforeMiddle}${middle.toString().padStart(5, '0')}${afterMiddle}`;
      const isDiscovered = middleNumbers.some(item => item.middle === middle);
      allIdsInRange.push({
        id: generatedId,
        middle: middle,
        discovered: isDiscovered
      });
    }

    console.log(`🎯 Generated ${allIdsInRange.length} IDs in range`);

    return {
      lowestMiddle,
      highestMiddle,
      totalRange,
      discoveredCount,
      missingCount,
      allIdsInRange,
      discoveredMiddles: middleNumbers.map(item => item.middle)
    };
  }

  function generateNextProductUrl(nextSetId) {
    let currentUrl = window.location.href;
    
    // Remove existing postfix if present (anything after a dash following the main ID)
    const dashIndex = currentUrl.lastIndexOf('-');
    if (dashIndex !== -1) {
      // Check if what comes after the dash looks like a set ID (starts with 1000 and is long enough)
      const afterDash = currentUrl.substring(dashIndex + 1);
      if (afterDash.startsWith('1000') && afterDash.length >= 14) {
        currentUrl = currentUrl.substring(0, dashIndex);
        console.log(`🔧 Removed existing postfix, base URL: ${currentUrl}`);
      }
    }
    
    // Format: cleanedOriginalURL-nextId
    return `${currentUrl}-${nextSetId}`;
  }

  function getJitteredDelay(base, jitter) {
    return base + (Math.random() * 2 - 1) * jitter;
  }

  function getDelayFromInputs() {
    const baseDelay = parseInt(document.getElementById('baseDelayInput').value, 10);
    const jitter = parseInt(document.getElementById('jitterInput').value, 10);
    return getJitteredDelay(baseDelay, jitter);
  }

  function scheduleNextArrow(delay = null) {
    if (!delay) delay = getDelayFromInputs();
    console.log('⏰ Scheduling next arrow click in', delay, 'ms');
    const timeoutId = setTimeout(() => {
      if (window.popmartHelper.isRunning) {
        clickNextArrow();
      }
    }, delay);
    trackTimeout(timeoutId);
  }

  function tryClickBoxImage() {
    if (!window.popmartHelper.isRunning) return;
    
    console.log('🔍 Looking for box image to click...');
    
    // Find container with class prefix index_bigBoxContainer
    const bigBoxContainer = Array.from(document.querySelectorAll('*')).find(el => 
      Array.from(el.classList).some(cls => cls.startsWith('index_bigBoxContainer'))
    );
    
    if (bigBoxContainer) {
      // Find first image with 'box_pic' in src within this container
      const boxImage = bigBoxContainer.querySelector('img[src*="box_pic"]');
      
      if (boxImage) {
        console.log('📦 Found and clicking box image');
        syntheticClick(boxImage);
        return true; // Successfully found and clicked box image 
      } else {
        console.log('❌ No box image found in container, scheduling next arrow with delay');
        scheduleNextArrow();
        return false;
      }
    } else {
      console.log('❌ No big box container found, scheduling next arrow with delay');
      scheduleNextArrow();
      return false;
    }
  }

  function highlightElement(element, duration = 1000) {
    const originalStyle = element.style.cssText;
    element.style.border = '3px solid red';
    element.style.boxShadow = '0 0 10px red';
    setTimeout(() => {
      element.style.cssText = originalStyle;
    }, duration);
  }

  function syntheticClick(element) {
    // Highlight the element first
    highlightElement(element);
    
    // Create and dispatch synthetic click events
    const events = ['mousedown', 'mouseup', 'click'];
    events.forEach(eventType => {
      const event = new MouseEvent(eventType, {
        bubbles: true,
        cancelable: true,
        view: window
      });
      element.dispatchEvent(event);
    });
    
    // Also try the regular click as backup
    // setTimeout(() => element.click(), 50);
  }

  function clickNextArrow() {
    if (!window.popmartHelper.isRunning) return;

    const nextBtns = findByClassPrefix('index_nextImg');
    const nextBtn = nextBtns.find(el => el.tagName === 'IMG' && isElementVisible(el));
    
    if (nextBtn) {
      console.log('➡️ Clicking next arrow');
      syntheticClick(nextBtn);
    } else {
      console.log('❌ No visible next arrow found - scheduling retry with delay');
      scheduleNextArrow();
    }
  }

  function updateToggleButtonState() {
    const toggleBtn = document.getElementById('toggleBtn');
    if (!toggleBtn) return;
    
    const onProductPage = isOnProductPage();
    
    if (window.popmartHelper.isRunning) {
      toggleBtn.textContent = 'Stop';
      toggleBtn.style.background = '#dc3545'; // Red background
      toggleBtn.style.color = 'white';
      toggleBtn.style.cursor = 'pointer';
      toggleBtn.style.opacity = '1';
    } else {
      toggleBtn.textContent = 'Start';
      
      if (onProductPage) {
        toggleBtn.style.background = 'white';
        toggleBtn.style.color = 'black';
        toggleBtn.disabled = false;
        toggleBtn.style.cursor = 'pointer';
        toggleBtn.style.opacity = '1';
      } else {
        toggleBtn.style.background = '#666';
        toggleBtn.style.color = '#ccc';
        toggleBtn.disabled = true;
        toggleBtn.style.cursor = 'not-allowed';
        toggleBtn.style.opacity = '0.6';
        toggleBtn.title = 'Must be on a product page to start';
      }
    }
  }

  function toggleScript() {
    if (window.popmartHelper.isRunning) {
      stopAllScriptActivity();
    } else {
      startScript();
    }
  }

  function startScript() {
    if (window.popmartHelper.isRunning) return;
    
    // Check if we're on a product page - just return silently if not (button should be disabled)
    if (!isOnProductPage()) {
      console.log('❌ Can only start on product pages (ending with /pop-now/set/{id})');
      return;
    }
    
    // Stop stock waiting if it's active
    stopStockWait();
    
    window.popmartHelper.isRunning = true;
    isRunning = true;
    updateToggleButtonState();
    console.log('🚀 Script started!');
    
    // Try to click box image first, fallback to next arrow if not found
    tryClickBoxImage();
  }

  function stopScript() {
    stopAllScriptActivity();
  }

  document.getElementById('toggleBtn').onclick = toggleScript;
  document.getElementById('waitStockBtn').onclick = toggleStockWaiting;

  // Initialize button states
  updateStockButtonState();
  updateToggleButtonState();

  const origOpen = window.popmartHelper.originalXHR.open;
  const origSend = window.popmartHelper.originalXHR.send;
  XMLHttpRequest.prototype.open = function(method, url) {
    this._isExtractRequest = method === 'POST' && url.includes('/shop/v1/box/box_set/extract');
    this._isChooseRequest = method === 'POST' && url.includes('/shop/v1/box/box_set/choose');
    return origOpen.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function(body) {
    if (this._isExtractRequest || this._isChooseRequest) {
      const xhr = this;
      const origOnReadyStateChange = xhr.onreadystatechange;
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
          try {
            const json = JSON.parse(xhr.responseText);
            jsonViewer.textContent = JSON.stringify(json, null, 2);
            
            if (xhr._isExtractRequest && json.data && json.data.set_no && json.data.box_list) {
              const setNo = json.data.set_no;
              const currentTime = Date.now();
              
              if (!setRecords[setNo]) {
                setRecords[setNo] = { 
                  count: 1, 
                  box_list: json.data.box_list,
                  firstDiscovered: currentTime
                };
              } else {
                setRecords[setNo].count++;
                setRecords[setNo].box_list = json.data.box_list;
              }
              lastSetNo = setNo;
              window.popmartHelper.setRecords = setRecords;
              window.popmartHelper.lastSetNo = lastSetNo;
              localStorage.setItem(getStorageKey(), JSON.stringify(setRecords));
              updateSetGrid();
              
              console.log('📊 Set processed:', setNo);
              
              // Click first box image after delay
              setTimeout(() => {
                tryClickBoxImage();
              }, 350);
              
            } else if (xhr._isChooseRequest) {
              console.log('🎲 Choose response received');
              
              if (xhr.responseText.includes('All boxes have been reserved')) {
                console.log('📦 All boxes reserved - moving to next set');
                scheduleNextArrow();
              } else {
                console.log('🎯 Box chosen successfully - stopping');
                window.popmartHelper.isRunning = false;
                isRunning = false;
              }
            }
          } catch (e) {
            jsonViewer.textContent = 'Failed to parse JSON';
            console.error('❌ Failed to parse XHR JSON:', e);
          }
        }
        if (origOnReadyStateChange) origOnReadyStateChange.apply(this, arguments);
      };
    }
    return origSend.apply(this, arguments);
  };

  updateSetGrid();
  console.log('Full helper script loaded with third-div-only setAttribute debugging and style protection!');

  // === STOCK CHECKING FUNCTIONALITY ===
  function updateStockButtonState() {
    const stockBtn = document.getElementById('waitStockBtn');
    if (!stockBtn) return;
    
    if (window.popmartHelper.isWaitingForStock) {
      stockBtn.textContent = 'Stop Waiting for Stock';
      stockBtn.disabled = false; // Make it clickable to stop
      stockBtn.style.background = '#28a745'; // Green background
      stockBtn.style.color = 'white';
      stockBtn.style.cursor = 'pointer'; // Changed from 'not-allowed'
      stockBtn.style.opacity = '1'; // Changed from '0.8'
    } else {
      stockBtn.textContent = 'Wait Until In Stock';
      stockBtn.disabled = false;
      stockBtn.style.background = 'white';
      stockBtn.style.color = 'black';
      stockBtn.style.cursor = 'pointer';
      stockBtn.style.opacity = '1';
    }
  }

  function toggleStockWaiting() {
    if (window.popmartHelper.isWaitingForStock) {
      stopStockWait();
    } else {
      waitUntilInStock();
    }
  }

  function waitUntilInStock() {
    console.log('📦 Starting stock check routine');
    window.popmartHelper.isWaitingForStock = true;
    updateStockButtonState();
    
    // Find and click element with class starting with "header_logo"
    const headerLogoElement = findByClassPrefix('header_logo').find(el => isElementVisible(el));
    
    if (headerLogoElement) {
      console.log('🏠 Clicking header logo element');
      highlightElement(headerLogoElement, 1000);
      syntheticClick(headerLogoElement);
      
      // Wait 5 seconds then simulate back button
      const timeoutId1 = setTimeout(() => {
        if (!window.popmartHelper.isWaitingForStock) return;
        console.log('⬅️ Simulating back button press');
        window.history.back();
        
        // After back navigation, start polling for next arrow
        const timeoutId2 = setTimeout(() => {
          startArrowPolling();
        }, 500);
        trackTimeout(timeoutId2);
      }, 5000);
      trackTimeout(timeoutId1);
    } else {
      console.log('❌ Header logo element not found, retrying in 2 seconds...');
      const timeoutId = setTimeout(waitUntilInStock, 2000);
      trackTimeout(timeoutId);
    }
  }
  
  function startArrowPolling() {
    if (!window.popmartHelper.isWaitingForStock) return;
    
    console.log('🔍 Starting arrow polling for 2 seconds...');
    const startTime = Date.now();
    const pollDuration = 2000; // 2 seconds
    const pollInterval = 100; // Check every 100ms
    
    function pollForArrow() {
      if (!window.popmartHelper.isWaitingForStock) return;
      
      const nextBtns = findByClassPrefix('index_nextImg');
      const nextBtn = nextBtns.find(el => el.tagName === 'IMG' && isElementVisible(el));
      
      if (nextBtn) {
        console.log('✅ Visible next arrow found - stock is available! Starting main loop...');
        window.popmartHelper.isWaitingForStock = false;
        updateStockButtonState();
        startScript();
        return;
      }
      
      const elapsed = Date.now() - startTime;
      if (elapsed < pollDuration) {
        // Continue polling
        const timeoutId = setTimeout(pollForArrow, pollInterval);
        trackTimeout(timeoutId);
      } else {
        // 2 seconds elapsed, no arrow found - continue stock polling loop
        console.log('📦 Visible arrow not found after 2 seconds, continuing stock polling in 1 second...');
        const timeoutId = setTimeout(() => {
          if (window.popmartHelper.isWaitingForStock) {
            waitUntilInStock();
          }
        }, 1000);
        trackTimeout(timeoutId);
      }
    }
    
    // Start the polling
    pollForArrow();
  }
  
  function stopStockWait() {
    if (window.popmartHelper.isWaitingForStock) {
      console.log('🛑 Stopping stock wait');
      window.popmartHelper.isWaitingForStock = false;
      updateStockButtonState();
      
      // Navigate back to product page if not already there
      // Check if we're currently on the main product page by looking for next arrow
      const nextBtns = findByClassPrefix('index_nextImg');
      const hasVisibleArrow = nextBtns.some(el => el.tagName === 'IMG' && isElementVisible(el));
      
      if (!hasVisibleArrow) {
        console.log('⬅️ Navigating back to product page...');
        window.history.back();
        
        // Wait a moment for navigation to complete, then check if we're on the right page
        const timeoutId = setTimeout(() => {
          const nextBtnsAfterBack = findByClassPrefix('index_nextImg');
          const hasArrowAfterBack = nextBtnsAfterBack.some(el => el.tagName === 'IMG' && isElementVisible(el));
          
          if (hasArrowAfterBack) {
            console.log('✅ Successfully returned to product page');
          } else {
            console.log('⚠️ May not be on product page yet, but stock waiting is stopped');
          }
        }, 1000);
        trackTimeout(timeoutId);
      } else {
        console.log('✅ Already on product page');
      }
    }
  }

  // === ENHANCED STOP FUNCTIONALITY ===
  function stopAllScriptActivity() {
    console.log('🛑 Stopping all script activity and clearing timers');
    
    // Stop main loop
    window.popmartHelper.isRunning = false;
    isRunning = false;
    
    // Stop stock waiting
    window.popmartHelper.isWaitingForStock = false;
    
    // Clear any stored timeout IDs (we'll need to track these)
    if (window.popmartHelper.activeTimeouts) {
      window.popmartHelper.activeTimeouts.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      window.popmartHelper.activeTimeouts = [];
    }
    
    // Update button states
    updateStockButtonState();
    updateToggleButtonState();
    
    console.log('✅ All script activity stopped and timers cleared');
  }
  
  function isOnProductPage() {
    const url = window.location.href;
    const productPagePattern = /\/pop-now\/set\/\d+/;
    return productPagePattern.test(url);
  }
  
  function trackTimeout(timeoutId) {
    if (!window.popmartHelper.activeTimeouts) {
      window.popmartHelper.activeTimeouts = [];
    }
    window.popmartHelper.activeTimeouts.push(timeoutId);
  }

  function getProductPageUrl() {
    const currentUrl = window.location.href;
    
    // If we're already on a product page, return the current URL
    if (isOnProductPage()) {
      return currentUrl;
    }
    
    // If we're on the site but not on a product page, try to construct a product page URL
    if (currentUrl.includes('popmart.com')) {
      // Extract the base URL and construct a product page pattern
      const baseUrl = currentUrl.split('/').slice(0, 3).join('/'); // Gets https://domain.com
      return `${baseUrl}/us/pop-now/set/`; // Generic product page path
    }
    
    // Fallback to a default POP MART product page
    return 'https://www.popmart.com/us/pop-now/set/';
  }

  function updateProductPageLink() {
    const productPageLink = document.getElementById('productPageLink');
    if (!productPageLink) return;
    
    const productUrl = getProductPageUrl();
    productPageLink.href = productUrl;
    
    if (isOnProductPage()) {
      productPageLink.textContent = '📦 Current Product Page';
      productPageLink.style.color = '#4da6ff';
    } else {
      productPageLink.textContent = '📦 Go to Product Page';
      productPageLink.style.color = '#ffa500'; // Orange color to indicate it's not current page
    }
  }

  // Initialize the product page link
  updateProductPageLink();
})();

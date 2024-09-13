// ==UserScript==
// @name         Linkedin - Job Posting Blocker
// @namespace    http://tampermonkey.net/
// @version      2024-09-13
// @description  Hide job postings by certain companines
// @author       Asil Aygün
// @match        https://www.linkedin.com/jobs/search/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let blockedCompanyNames = [];

    const loadBlockedCompanies = () => {
        const storedCompanies = localStorage.getItem("blocked_companies");
        if (storedCompanies) {
            try {
                blockedCompanyNames = JSON.parse(storedCompanies);
            } catch (error) {
                console.error("Error parsing blocked companies, default empty array will be used.", error);
            }
        } else {
            console.log("No blocked companies found in localStorage - default empty array will be used");
        }
    }

    // update localStorage
    const updateBlockedCompanies = (companyName) => {
        let blockedCompanies = localStorage.getItem("blocked_companies");
        if (!blockedCompanies) {
            blockedCompanies = [companyName];
        } else {
            blockedCompanies = JSON.parse(blockedCompanies);
            if (blockedCompanies.includes(companyName)) {
                alert(`${companyName} is already blocked.`);
                return;
            }
            blockedCompanies.push(companyName);
        }
        localStorage.setItem("blocked_companies", JSON.stringify(blockedCompanies));
        alert(`${companyName} has been added to the blocked list. Please refresh the page to start seeing the changes.`);
    }

    const addBlockButton = (div) => {
        let blockDiv = document.createElement("div")
        blockDiv.textContent = "[Block company]";
        blockDiv.style.fontSize = "10px";
        blockDiv.style.padding = "0";
        blockDiv.style.margin="0";
        blockDiv.style.width="90px";
        blockDiv.style.zIndex = "100";
        blockDiv.style.position="absolute"
        blockDiv.style.bottom="8px"
        blockDiv.style.right="0"
        blockDiv.style.cursor="pointer"
        blockDiv.style.color="#460409";
        blockDiv.style.opacity="0.8"

        blockDiv.addEventListener("mouseenter", () => {
            blockDiv.style.color="#191919"
            blockDiv.style.opacity="1"
        })

        blockDiv.addEventListener("mouseout", () => {
            blockDiv.style.color="#460409"
        })

        blockDiv.addEventListener("click", () => {
            let companyName = div.querySelector("span.job-card-container__primary-description").textContent.trim();
            let answer = window.confirm("Block " + companyName + " ? ")
            if (answer) {
                updateBlockedCompanies(companyName)
            }
        })
        div.appendChild(blockDiv)
    }

    let currentURL = location.href;

    const resetObservers = () => {
        initialObserver.disconnect();
        observer.disconnect();
        startProcess();
    };

    const checkForSpan = (div) => {
        const span = div.querySelector("span.job-card-container__primary-description");
        if (span) {
            let companyName = span.textContent.trim();
            if (blockedCompanyNames.includes(companyName)) {
                div.style.display = "none";
            } else {
                if (div.className.includes("job-card-container") || div.className.includes("jobs-search-results__list-item")) {
                    addBlockButton(div);
                }
            }
        }
    };

    // this func will run once the targetDivs are available
    const runMainObserver = () => {
        const targetDivs = [...document.querySelectorAll(".scaffold-layout__list-container > li")];
        targetDivs.forEach((div) => {
            checkForSpan(div);
            observer.observe(div, { childList: true, subtree: true });
        });
    };

    // observer for monitoring when targetDivs are available
    const initialObserver = new MutationObserver((mutations, observerInstance) => {
        const targetDivs = document.querySelectorAll(".scaffold-layout__list-container > li");
        if (targetDivs.length >= 25) {
            // stop observing once the targetDivs are found
            observerInstance.disconnect();
            runMainObserver();
        }
    });

    const startProcess = () => {
        initialObserver.observe(document.body, { childList: true, subtree: true });
    };

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        checkForSpan(node);
                    }
                });
            }
        });
    });

    const monitorURLChange = () => {
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;

        history.pushState = function(...args) {
            originalPushState.apply(history, args);
            handleURLChange();
        };

        history.replaceState = function(...args) {
            originalReplaceState.apply(history, args);
            handleURLChange();
        };
        window.addEventListener('popstate', handleURLChange);
    };

    const handleURLChange = () => {
        if (currentURL !== location.href) {
            currentURL = location.href;
            resetObservers();
        }
    };


    loadBlockedCompanies()
    monitorURLChange();
    startProcess();



})();
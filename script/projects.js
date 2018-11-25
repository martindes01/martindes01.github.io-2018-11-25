// Designed to work alongside Material Design Lite v1.3.0

(function () {
    // Development
    document.getElementById("dev").innerHTML += "<span>projects.js - Commit 25</span>";

    // Private constants (ES6 const keyword lacks support)
    var Delimiter_Tags = ',';
    var ErrorEmojis = ["\\(o_o)/", "(;-;)", "(>_<)", "(._.)", "(^.^)"];
    var FilterSubject_Tag = "tag";
    var NodeInfo_Body = { Path: "body", Attribute: false, Dimension: 1 };
    var NodeInfo_Date = { Path: "head meta[name=\"date\"]", Attribute: "content", Dimension: 2 };
    var NodeInfo_ResultURL = { Path: "head link[rel=\"result-url\"]", Attribute: "href", Dimension: 0 };
    var NodeInfo_Tags = { Path: "head meta[name=\"tags\"]", Attribute: "content", Dimension: 3 };
    var Path_ProjectsXML = "projects.xml";
    var RegExp_NonWordCharacters = /\W+/;
    var ResultMax = 5;
    var SearchScore_End = 0.4;
    var SearchScore_Middle = 0.2;
    var SearchScore_Span = 1;
    var SearchScore_Start = 0.7;

    // Private variables - Elements
    var Error_4xx = document.getElementById("error-4xx");
    var Error_4xx_Code = document.getElementById("error-4xx-code");
    var Error_NoResult = document.getElementById("error-no-result");
    var Error_Other = document.getElementById("error-other");
    var ErrorContainer = document.getElementById("error-container");
    var ErrorEmoji = document.getElementById("error-emoji");
    var FilterChips = document.querySelectorAll(".site-js-filter-chip");
    var NextButtons = document.querySelectorAll(".site-js-next-button");
    var NextButtonTooltips = document.querySelectorAll(".site-js-next-button-tooltip");
    var PreviousButtons = document.querySelectorAll(".site-js-previous-button");
    var PreviousButtonTooltips = document.querySelectorAll(".site-js-previous-button-tooltip");
    var ResultArea = document.getElementById("result-area");
    var ResultContainer = document.getElementById("result-container");
    var ResultIndices = document.querySelectorAll(".site-js-result-index");
    var ResultPlaceholder = document.getElementById("result-placeholder");
    var SearchButton = document.getElementById("search-button");
    var SearchButtonTooltip = document.getElementById("search-button-tooltip");
    var SearchField = document.getElementById("search-field");

    // Private variables - Values
    var ErrorEmojisIndex = 0;
    var Filters = [];
    var Projects_All = [];
    var Projects_Search = [];
    var ResultIndex;
    var ResultSetLB;
    var ResultSetUB;
    var ResultText;
    var ResultTotal;

    // Event listeners
    if (document.addEventListener) {
        // Filter chips - Toggle filter on click
        for (var i = 0, length = FilterChips.length; i < length; i++) {
            FilterChips[i].addEventListener("click", Search_ToggleFilter, false);
        }
        // Next buttons - Show next set of results on click
        for (var i = 0, length = NextButtons.length; i < length; i++) {
            NextButtons[i].addEventListener("click", Results_IterateNext, false);
        }
        // Previous buttons - Show previous set of results on click
        for (var i = 0, length = PreviousButtons.length; i < length; i++) {
            PreviousButtons[i].addEventListener("click", Results_IteratePrevious, false);
        }
        // Search button - Initiate search on click
        SearchButton.addEventListener("click", Search_Initiate, false);
    } else if (document.attachEvent) {
        // Support for Internet Explorer
        // Filter chips - Toggle filter on click
        for (var i = 0, length = FilterChips.length; i < length; i++) {
            FilterChips[i].attachEvent("onclick", Search_ToggleFilter);
        }
        // Next buttons - Show next set of results on click
        for (var i = 0, length = NextButtons.length; i < length; i++) {
            NextButtons[i].attachEvent("onclick", Results_IterateNext);
        }
        // Previous buttons - Show previous set of results on click
        for (var i = 0, length = PreviousButtons.length; i < length; i++) {
            PreviousButtons[i].attachEvent("onclick", Results_IteratePrevious);
        }
        // Search button - Initiate search on click
        SearchButton.attachEvent("onclick", Search_Initiate);
    }

    // Initialise page and load projects XML document
    Reset_OnSearch();
    Document_Load(Path_ProjectsXML, Results_Initialise);

    // Load specified document from server
    function Document_Load(Path, CallbackFunction) {
        var Request = new XMLHttpRequest();
        // Define function to handle response
        Request.onreadystatechange = function () {
            // Check whether request is complete
            if (this.readyState === 4) {
                // Check whether request has succeeded
                if (this.status === 200) {
                    // Pass response to callback function
                    CallbackFunction(this);
                } else {
                    // Test whether client error
                    if (this.status >= 400 && this.status < 500) {
                        // Select client error message
                        Error_4xx_Code.innerHTML = this.status;
                        Error_4xx.classList.remove("hidden");
                    } else {
                        // Select other error message
                        Error_Other.classList.remove("hidden");
                    }
                    // Display error message
                    Results_DisplayError();
                }
            }
        };
        // Send request for file
        Request.open("GET", Path + "?id=" + Math.random(), true);
        Request.send();
    }

    // Enable elements after text displayed
    function Enable_OnDisplay() {
        // Enable filter chips
        for (var i = 0, length = FilterChips.length; i < length; i++) {
            FilterChips[i].removeAttribute("disabled");
        }
        // Enable search button
        SearchButton.removeAttribute("disabled");
        // Add event listener to search field - Initiate search on enter key press
        if (document.addEventListener) {
            SearchField.addEventListener("keypress", Listener_SearchFieldKeyPress = function (e) {
                // Test whether enter key was pressed
                if (e.key === "Enter") {
                    Search_Initiate();
                }
            }, false);
        } else if (document.attachEvent) {
            // Support for Internet Explorer
            SearchField.attachEvent("onkeypress", Listener_SearchFieldKeyPress = function () {
                // Test whether enter key was pressed
                if (window.event.key === "Enter") {
                    Search_Initiate();
                }
            });
        }
    }

    // Reset elements and variables on iterate
    function Reset_OnIterate() {
        // Reset elements
        for (var i = 0, length = FilterChips.length; i < length; i++) {
            if (!FilterChips[i].hasAttribute("disabled")) {
                FilterChips[i].setAttribute("disabled", '');
            }
        }
        if (!Error_4xx.classList.contains("hidden")) {
            Error_4xx.classList.add("hidden");
        }
        if (!Error_NoResult.classList.contains("hidden")) {
            Error_NoResult.classList.add("hidden");
        }
        if (!Error_Other.classList.contains("hidden")) {
            Error_Other.classList.add("hidden");
        }
        if (!ErrorContainer.classList.contains("hidden")) {
            ErrorContainer.classList.add("hidden");
        }
        if (!ResultContainer.classList.contains("hidden")) {
            ResultContainer.classList.add("hidden");
        }
        for (var i = 0, length = ResultIndices.length; i < length; i++) {
            ResultIndices[i].innerHTML = '';
        }
        if (ResultPlaceholder.classList.contains("hidden")) {
            ResultPlaceholder.classList.remove("hidden");
        }
        if (!SearchButton.hasAttribute("disabled")) {
            SearchButton.setAttribute("disabled", '');
        }
        if (SearchButtonTooltip.classList.contains("is-active")) {
            SearchButtonTooltip.classList.remove("is-active");
        }
        if (typeof Listener_SearchFieldKeyPress === "function") {
            if (document.removeEventListener) {
                SearchField.removeEventListener("keypress", Listener_SearchFieldKeyPress, false);
            } else if (document.detachEvent) {
                // Support for Internet Explorer
                SearchField.detachEvent("onkeypress", Listener_SearchFieldKeyPress);
            }
        }
        // Reset variables
        ResultText = '';
    }

    // Reset elements and variables on search
    function Reset_OnSearch() {
        // Reset elements
        for (var i = 0, length = PreviousButtons.length; i < length; i++) {
            if (!PreviousButtons[i].hasAttribute("disabled")) {
                PreviousButtons[i].setAttribute("disabled", '');
            }
        }
        for (var i = 0, length = PreviousButtonTooltips.length; i < length; i++) {
            if (PreviousButtonTooltips[i].classList.contains("is-active")) {
                PreviousButtonTooltips[i].classList.remove("is-active");
            }
        }
        // Reset variables
        Projects_Search.splice(0);
        ResultIndex = 0;
        ResultSetLB = 1;
        ResultText = '';
        // Reset others
        Reset_OnIterate();
    }

    // Display error message
    function Results_DisplayError() {
        // Increment error emoji
        if (++ErrorEmojisIndex >= ErrorEmojis.length) {
            ErrorEmojisIndex = 0;
        }
        ErrorEmoji.innerHTML = ErrorEmojis[ErrorEmojisIndex];
        // Replace result placeholder with error container
        ErrorContainer.classList.remove("hidden");
        ResultPlaceholder.classList.add("hidden");
        // Test whether saved project data exists
        if (Projects_All.length) {
            // Enable search and result area elements
            Enable_OnDisplay();
        }
    }

    // Display search results
    function Results_DisplayText(Text) {
        // Post text to result area and upgrade any HTML elements with MDL classes
        ResultArea.innerHTML = Text;
        componentHandler.upgradeElements(ResultArea);
        // Replace result placeholder with result container
        ResultContainer.classList.remove("hidden");
        ResultPlaceholder.classList.add("hidden");
        // Enable search and result area elements
        Enable_OnDisplay();
    }

    // Initialise result area
    function Results_Initialise(Request) {
        // Store projects XML document
        var ProjectsXML = Request.responseXML;
        // Save data for each project
        var Bodies = XML_RetrieveTextContent(ProjectsXML, NodeInfo_Body).map(function (Body) {
            return Body.toLowerCase();
        });
        var Dates = XML_RetrieveTextContent(ProjectsXML, NodeInfo_Date);
        var ResultURLs = XML_RetrieveTextContent(ProjectsXML, NodeInfo_ResultURL);
        var Tags = XML_RetrieveTextContent(ProjectsXML, NodeInfo_Tags).map(function (Tags) {
            return Tags.toLowerCase().split(Delimiter_Tags);
        });
        for (var i in ResultURLs) {
            Projects_All.push([ResultURLs[i], Bodies[i], Dates[i], Tags[i]]);
        }
        // Iterate initial set of results
        Projects_Search = Projects_All.slice(0);
        ResultTotal = Projects_Search.length;
        Results_Iterate();
    }

    // Iterate set of results specified by variables
    function Results_Iterate() {
        if (ResultTotal) {
            // Test whether last set of results
            if (ResultTotal - ResultSetLB < ResultMax) {
                // Include all remaining results
                ResultSetUB = ResultTotal;
                // Disable next buttons
                for (var i = 0, length = NextButtons.length; i < length; i++) {
                    if (!NextButtons[i].hasAttribute("disabled")) {
                        NextButtons[i].setAttribute("disabled", '');
                    }
                }
                // Disable next button tooltips
                for (var i = 0, length = NextButtonTooltips.length; i < length; i++) {
                    if (NextButtonTooltips[i].classList.contains("is-active")) {
                        NextButtonTooltips[i].classList.remove("is-active");
                    }
                }
            } else {
                // Include specified number of results
                ResultSetUB = ResultMax;
                // Enable next buttons
                for (var i = 0, length = NextButtons.length; i < length; i++) {
                    if (NextButtons[i].hasAttribute("disabled")) {
                        NextButtons[i].removeAttribute("disabled");
                    }
                }
            }
            // Begin requesting results
            Results_Request(ResultSetLB - 1);
        } else {
            // Select no result error message
            Error_NoResult.classList.remove("hidden");
            // Display error message
            Results_DisplayError();
        }
    }

    // Iterate next set of results
    function Results_IterateNext() {
        // Reset elements and variables as necessary
        Reset_OnIterate();
        // Scroll result placeholder into view
        ResultPlaceholder.scrollIntoView({ block: "nearest" });
        // Set iteration variables
        ResultSetLB += ResultMax;
        ResultIndex = ResultSetLB - 1;
        // Enable previous buttons
        for (var i = 0, length = PreviousButtons.length; i < length; i++) {
            if (PreviousButtons[i].hasAttribute("disabled")) {
                PreviousButtons[i].removeAttribute("disabled");
            }
        }
        // Iterate this set of results
        Results_Iterate();
    }

    // Iterate previous set of results
    function Results_IteratePrevious() {
        // Reset elements and variables as necessary
        Reset_OnIterate();
        // Scroll result placeholder into view
        ResultPlaceholder.scrollIntoView({ block: "nearest" });
        // Set iteration variables
        ResultSetLB -= ResultMax;
        ResultIndex = ResultSetLB - 1;
        // Test whether this is first set of results
        if (ResultSetLB === 1) {
            // Disable previous buttons
            for (var i = 0, length = PreviousButtons.length; i < length; i++) {
                if (!PreviousButtons[i].hasAttribute("disabled")) {
                    PreviousButtons[i].setAttribute("disabled", '');
                }
            }
            // Disable previous button tooltips
            for (var i = 0, length = PreviousButtonTooltips.length; i < length; i++) {
                if (PreviousButtonTooltips[i].classList.contains("is-active")) {
                    PreviousButtonTooltips[i].classList.remove("is-active");
                }
            }
        }
        // Iterate this set of results
        Results_Iterate();
    }

    // Request specified result from server
    function Results_Request(Index) {
        Document_Load(Projects_Search[Index][NodeInfo_ResultURL.Dimension], Results_RetrieveText);
    }

    // Retrieve result text
    function Results_RetrieveText(Request) {
        ResultText += Request.responseText;
        // Test whether all results retrieved
        if (++ResultIndex === ResultSetUB) {
            // Update result indices
            for (var i = 0, length = ResultIndices.length; i < length; i++) {
                ResultIndices[i].innerHTML = ResultSetLB + " to " + ResultSetUB + " of " + ResultTotal;
            }
            // Post result text to result area
            Results_DisplayText(ResultText);
        } else {
            // Request next result
            Results_Request(ResultIndex);
        }
    }

    // Initiate search
    function Search_Initiate() {
        // Reset elements and variables as necessary
        Reset_OnSearch();
        // Copy all projects to filter projects
        var Projects_Filter = Projects_All.slice(0);
        // Test whether filters are active
        if (Filters.length) {
            // Apply each filter
            for (var i in Filters) {
                // Test filter subject
                switch (Filters[i][0]) {
                    case FilterSubject_Tag:
                        for (var j = 0; j < Projects_Filter.length; j++) {
                            // Test whether project tags contain filter tag
                            var ContainsTag = false;
                            for (var k in Projects_Filter[j][NodeInfo_Tags.Dimension]) {
                                if (Projects_Filter[j][NodeInfo_Tags.Dimension][k] === Filters[i][1]) {
                                    ContainsTag = true;
                                }
                            }
                            if (!ContainsTag) {
                                // Remove project from filter projects
                                Projects_Filter.splice(j, 1);
                                j--;
                            }
                        }
                        break;
                }
            }
        }
        // Test whether search query contains search items
        var SearchQuery = SearchField.value.trim().toLowerCase();
        if (SearchQuery) {
            // Split search query into items to be matched
            var SearchItems = SearchQuery.split(RegExp_NonWordCharacters);
            // Assign each project weighted score of matched search items
            var SearchRankings = [];
            for (var i in Projects_Filter) {
                var Count = 0;
                for (var j in SearchItems) {
                    Count += Search_ReturnScore(Projects_Filter[i][NodeInfo_Body.Dimension], SearchItems[j]);
                }
                SearchRankings.push([Projects_Filter[i], Count]);
            }
            // Sort search rankings by score descending
            SearchRankings.sort(Search_SortRankings);
            // Save matched projects
            for (var i in SearchRankings) {
                if (SearchRankings[i][1]) {
                    Projects_Search.push(SearchRankings[i][0]);
                }
            }
        } else {
            // Copy filter projects to search projects
            Projects_Search = Projects_Filter.slice(0);
        }
        // Iterate initial set of results
        ResultTotal = Projects_Search.length;
        Results_Iterate();
    }

    // Return weighted score of matches of substring in string
    function Search_ReturnScore(String, Substring) {
        var Score = 0;
        // Test whether substring is not empty
        if (Substring) {
            var Position = 0;
            var Step = Substring.length;
            while (true) {
                // Find position of next substring in string
                Position = String.indexOf(Substring, Position);
                // Test whether substring was found
                if (Position >= 0) {
                    // Increment score based on position of substring within string entry
                    if (String.charAt(Position - 1) === "[") {
                        if (String.charAt(Position + Step) === "]") {
                            Score += SearchScore_Span;
                        } else {
                            Score += SearchScore_Start;
                        }
                    } else if (String.charAt(Position + Step) === "]") {
                        Score += SearchScore_End;
                    } else {
                        Score += SearchScore_Middle;
                    }
                    // Increase search position so find not repeated
                    Position += Step;
                } else {
                    break;
                }
            }
        }
        return Score;
    }

    // Sort search rankings by score descending
    function Search_SortRankings(a, b) {
        // Test whether values equal
        if (a[1] === b[1]) {
            // Retain order
            return 0;
        } else {
            // Sort descending
            return a[1] > b[1] ? -1 : 1;
        }
    }

    // Toggle search filter
    function Search_ToggleFilter() {
        if (this.classList.contains("is-active")) {
            // Remove filter from current filters
            if (this.hasAttribute("data-filter-subject") && this.hasAttribute("data-filter-value")) {
                for (var i = 0; i < Filters.length; i++) {
                    if (Filters[i][0] === this.getAttribute("data-filter-subject") && Filters[i][1] === this.getAttribute("data-filter-value")) {
                        Filters.splice(i, 1);
                        break;
                    }
                }
            }
            // Remove active filter chip classes from element and children
            this.classList.remove("mdl-button--primary");
            this.classList.remove("mdl-button--raised");
            if (this.querySelector(".mdl-chip__action")) {
                this.querySelector(".mdl-chip__action").classList.remove("mdl-color-text--primary-contrast");
            }
            // Add inactive filter chip classes
            this.classList.add("des-color-text--surface-contrast");
            // Remove active filter chip flag class
            this.classList.remove("is-active");
        } else {
            // Add filter to current filters
            if (this.hasAttribute("data-filter-subject") && this.hasAttribute("data-filter-value")) {
                Filters.push([this.getAttribute("data-filter-subject"), this.getAttribute("data-filter-value")]);
            }
            // Remove inactive filter chip classes
            this.classList.remove("des-color-text--surface-contrast");
            // Add active filter chip classes to element and children
            this.classList.add("mdl-button--primary");
            this.classList.add("mdl-button--raised");
            if (this.querySelector(".mdl-chip__action")) {
                this.querySelector(".mdl-chip__action").classList.add("mdl-color-text--primary-contrast");
            }
            // Add active filter chip flag class
            this.classList.add("is-active");
        }
    }

    // Retrieve text content of nodes at specified path
    function XML_RetrieveTextContent(ContextNode, NodeInfo) {
        var TextValues = [];
        // Retrieve nodes at specified path
        var Nodes = ContextNode.querySelectorAll(NodeInfo.Path);
        // Test whether attribute value specified
        if (NodeInfo.Attribute) {
            // Retrieve specified attribute value
            for (var i = 0, length = Nodes.length; i < length; i++) {
                if (Nodes[i].hasAttribute(NodeInfo.Attribute)) {
                    TextValues.push(Nodes[i].getAttribute(NodeInfo.Attribute));
                }
            }
        } else {
            // Retrieve text content
            for (var i = 0, length = Nodes.length; i < length; i++) {
                TextValues.push(Nodes[i].textContent);
            }
        }
        return TextValues;
    }
})();

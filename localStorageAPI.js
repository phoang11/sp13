/*!
 * Client side javascript libraries for connecting to local storage
 * uploader and downloader service. Uses REST/JSON Web API 2 at
 * server. These are the client side functions that wrap the
 * AJAX calls to the server.
 */

/* The Root of the URL at which the WebAPI is available */

var lsURI = 'http://' + window.location.host + '/';

// Check to see if the user's browser supports local storage. If
// it does not, they won't be able to take the test.

function hasLocalStorage() {
    try {
        return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
        return false;
    }
}

// Convert the local storage to a JSON string for sending to
// the REST service that stores it on the server.

function LocalStorageToString() {
    var elemArray = [];
    var localStorageOK = hasLocalStorage();
    if (localStorageOK) {
        var elem;
        for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i);
            if(key !== "ALEA_Lease")
                elemArray.push(
                {
                    K: key,
                    V: localStorage.getItem(key)
                });
        }
    }
    return JSON.stringify({ Items: elemArray });
}

// Convert the received JSON local storage from the
// REST service into local storage items on the browser.

function StringToLocalStorage(str) {
    var localStorageOK = hasLocalStorage();
    if (localStorageOK) {
        var items = JSON.parse(str);
        for (var i = 0, len = items.Items.length; i < len; i++)
            localStorage.setItem(items.Items[i].K, items.Items[i].V);
    }
}

// Invoke a parameterless WebAPI method on the service
// just to make sure it is there and has network connectivity.

function PingTest() {
    var pingResult = "";
    $.ajax({
        type: "POST",
        url: lsURI + "api/alea/test",
        contentType: "application/json",
        accepts: "application/json",
        dataType: "json",
        async: false,
        success: function (data, status, xhr) {
            pingResult = data;
        },
        error: function (xhr, status, errThrown) {
            pingResult = "";
        }
    });
    return pingResult;
}

// Invoke a parameterless WebAPI method on the service
// just to make sure it is there and has network connectivity.

function DbTest() {
    var pingResult = "";
    $.ajax({
        type: "POST",
        url: lsURI + "api/alea/dbtest",
        contentType: "application/json",
        accepts: "application/json",
        dataType: "json",
        async: false,
        success: function (data, status, xhr) {
            pingResult = data;
        },
        error: function (xhr, status, errThrown) {
            pingResult = "";
        }
    });
    return pingResult;
}

// Retrieve the local storage for the specified lease
// lease: the lease for the specified exam.
// Returns true if successful.

function LSDownload(lease) {
    var succeeded = false;
    var localStorageOK = hasLocalStorage();
    if (localStorageOK) {
        $.ajax({
            type: "POST",
            url: lsURI + "api/alea/" + lease,
            contentType: "application/json",
            accepts: "application/json",
            dataType: "json",
            async: false,
            success: function (data, status, xhr) {
                for (var i = 0, len = data.Items.length; i < len; i++)
                    localStorage.setItem(data.Items[i].K, data.Items[i].V);
                succeeded = true;
            },
            error: function (xhr, status, errThrown) {
                succeeded = false;
            }
        });
    }
    return succeeded;
}

// Given a user's credentials, grant a user a lease for a new exam
// xan: the exam number, e.g. X026
// last: the person's last name
// first: the person's first name
// iun: the Learning Tree registration number for this student
// mins: the allowed duration of this exam
// Returned value: an object whose url property is set to the URL
// of the exam to be taken, and whose graderurl property is set to
// the URL to be used for grading the exam after it has been taken.

function GrantURL(xan, last, first, iun, mins) {
    var customerInfo = { xaNum: xan, lastName: last, firstName: first, iuNum: iun, duration: mins };
    var examURLs = null;
    $.ajax({
        type: "POST",
        data: JSON.stringify(customerInfo),
        url: lsURI + "api/alea/GrantURL",
        contentType: "application/json",
        accepts: "application/json",
        dataType: "json",
        async: false,
        success: function (data, status, xhr) {
            examURLs = data;
        },
        error: function (xhr, status, errThrown) {
            examURLs = null;
        }
    });
    return examURLs;
}

// Given a user's credentials, grant a user a lease for a new exam
// assid: The skills assessment ID issued by external programs
// assnum: The type of skills assessment, e.g. 'A021'
// pname: The name of the assessee who is taking the assessment
// iun: the Learning Tree registration number for this student
// mins: the allowed duration of this skills assessment
// Returned value: an object whose url property is set to the URL
// of the exam to be taken, and whose graderurl property is set to
// the URL to be used for grading the exam after it has been taken.

function GrantSkillsURL(assid, assnum, pname, iun, mins) {
    var skillsInfo =
    {
        assessmentID: assid,
        assessmentNum: assnum,
        participantName: pname,
        iuNum: iun,
        duration: mins
    };

    var skillsURLs = null;
    $.ajax({
        type: "POST",
        data: JSON.stringify(skillsInfo),
        url: lsURI + "api/alea/GrantSkillsURL",
        contentType: "application/json",
        accepts: "application/json",
        dataType: "json",
        async: false,
        success: function (data, status, xhr) {
            skillsURLs = data;
        },
        error: function (xhr, status, errThrown) {
            skillsURLs = null;
        }
    });
    return skillsURLs;
}

// Upload the local storage items to the server for the given user
// of the exercise manual. Users are identified by email address.

function ExManUpload(email, isAsync) {
    if(typeof isAsync === 'undefined')
        isAsync = false;
    var succeeded = isAsync;
    var localStorageOK = hasLocalStorage();
    if (localStorageOK) {
        localStorage.setItem('lsEmail', email);
        var lsJSON = LocalStorageToString();
        $.ajax({
            type: "POST",
            url: lsURI + 'api/exman/post',
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            accepts: "application/json",
            async: isAsync,
            data: lsJSON,
            success: function (data, status, xhr) {
                succeeded = true;
            },
            error: function (xhr, status, errThrown) {
                succeeded = false;
            }
        });
    }
    return succeeded;
}

// Retrieve the local storage for the specified lease
// lease: the lease for the specified exam.
// Returns true if successful.

function ExManDownload(email) {
    var succeeded = false;
    var localStorageOK = hasLocalStorage();
    if (localStorageOK) {
        $.ajax({
            type: "POST",
            data: JSON.stringify({ Email: email }),
            url: lsURI + "api/exman/get",
            contentType: "application/json",
            accepts: "application/json",
            dataType: "json",
            async: false,
            success: function (data, status, xhr) {
                localStorage.clear();
                for (var i = 0, len = data.Items.length; i < len; i++)
                    localStorage.setItem(data.Items[i].K, data.Items[i].V);
                succeeded = true;
            },
            error: function (xhr, status, errThrown) {
                succeeded = false;
            }
        });
    }
    return succeeded;
}

// Given the URL of the exam, extract the lease number from it.
// Note that the lease number is treated as a string, not an int.
// examURL: The full URL of the exam this person is taking

function GetLeaseFromURL(examURL) {
    var re = /lease=(\d+)/;
    var digits = re.exec(examURL);
    if (digits && digits.length >= 2) {
        return digits[1];
    }
    else
        return null;
}

// Check to see if the exam is running for the nominated exam ID
// lease: The lease number of this exam session for this user.

function ExamRunning(lease) {
    var examCheck = false;
    $.ajax({
        type: "POST",
        url: lsURI + "api/alea/check/" + lease,
        async: false,
        contentType: "application/json",
        accepts: "application/json",
        dataType: "json",
        success: function (data, status, xhr) {
            examCheck = data === 'valid';
        },
        error: function (xhr, status, errThrown) {
            examCheck = false;
        }
    });
    return examCheck;
}

// Given a lease for an exam, begin the exam
// lease: The lease number of this exam session for this user.
// Returns the duration of the exam in minutes.

function StartExam(lease) {
    var mins = 0;
    $.ajax({
        type: "POST",
        url: lsURI + "api/alea/start/" + lease,
        async: false,
        contentType: "application/json",
        accepts: "application/json",
        dataType: "json",
        success: function (data, status, xhr) {
            mins = data;
        },
        error: function (xhr, status, errThrown) {
            mins = 0;
        }
    });
    return mins;
}

// Upload the local storage items to the server for the given lease
// lease: the lease for the exam session in progress on this browser

function LSUpload(lease) {
    var succeeded = false;
    var localStorageOK = hasLocalStorage();
    if (localStorageOK) {
        var lsJSON = LocalStorageToString();
        $.ajax({
            type: "POST",
            url: lsURI + 'api/alea/post/' + lease,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            accepts: "application/json",
            async: false,
            data: lsJSON,
            async: false,
            success: function (data, status, xhr) {
                succeeded = true;
            },
            error: function (xhr, status, errThrown) {
                succeeded = false;
            }
        });
    }
    return succeeded;
}

// Set the assessment timer to a specified number of minutes

function InitTimer(minutes) {
    var localStorageOK = hasLocalStorage();
    if (localStorageOK) {
        var ends = new Date((new Date()).getTime() + minutes * 60000);
        localStorage.setItem("assessmentTimer", ends.toUTCString());
    }
}

// Cause the assessment timer to expire early

function ExpireTimer() {
    InitTimer(0);
}

// Return the expiry date and time, or the string 'Expired'
// if the expiry time has already gone by.

function ExpiryTime() {
    var localStorageOK = hasLocalStorage();
    if (localStorageOK) {
        var expires = localStorage.getItem("assessmentTimer");
        if (expires !== null) {
            var expiry = new Date(expires);
            if (expiry > new Date())
                return expiry;
        }
    }
    return "Expired";
}

// Retrieve the local storage for the specified grader lease
// lease: the grader lease for the specified exam.
// Returns true if successful.

function GraderDownload(lease) {
    var succeeded = false;
    var localStorageOK = hasLocalStorage();
    if (localStorageOK) {
        $.ajax({
            type: "POST",
            contentType: "application/json",
            accepts: "application/json",
            dataType: "json",
            url: lsURI + "api/alea/grader/" + lease,
            async: false,
            success: function (data, status, xhr) {
                for (var i = 0, len = data.Items.length; i < len; i++)
                    localStorage.setItem(data.Items[i].K, data.Items[i].V);
                succeeded = true;
            },
            error: function (xhr, status, errThrown) {
                succeeded = false;
            }
        });
    }
    return succeeded;
}

// Upload the local storage items to the server for the given lease
// lease: the lease for the exam session in progress on this browser

function GraderUpload(lease) {
    var succeeded = false;
    var localStorageOK = hasLocalStorage();
    if (localStorageOK) {
        var lsJSON = LocalStorageToString();
        $.ajax({
            type: "POST",
            url: lsURI + 'api/alea/graderpost/' + lease,
            data: lsJSON,
            contentType: "application/json",
            accepts: "application/json",
            dataType: "json",
            async: false,
            success: function (data, status, xhr) {
                succeeded = true;
            },
            error: function (xhr, status, errThrown) {
                succeeded = false;
            }
        });
    }
    return succeeded;
}

// Given a user's credentials, grant a grader a lease for a completed exam
// xan: the exam number, e.g. X026
// last: the person's last name
// first: the person's first name
// iun: the Learning Tree registration number for this student
// mins: the allowed duration of this exam
// Returns the URL to use for grading the assessment, or the empty
// string if the IU-Number and assessment number are not a vald
// completed assessment.

function GraderURL(xan, iun) {
    var customerInfo = { xaNum: xan, lastName: "", firstName: "", iuNum: iun, duration: 0 };
    var examURLs = null;
    $.ajax({
        type: "POST",
        data: JSON.stringify(customerInfo),
        url: lsURI + "api/alea/GraderURL",
        contentType: "application/json",
        accepts: "application/json",
        dataType: "json",
        async: false,
        success: function (data, status, xhr) {
            examURLs = data;
        },
        error: function (xhr, status, errThrown) {
            examURLs = null;
        }
    });
    return examURLs;
}




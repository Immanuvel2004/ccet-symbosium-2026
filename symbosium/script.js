const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxJAmNb8SXhXp9PSaScVb15x-zI8R6dBzeesbAKqHQDyF3IiZI_tO2J2mnCrGOZm607/exec"; 
const SECRET = "symposium_secure_2026";

let screenshotBase64 = "";
let isVerified = false;

/* 1. Image Handler */
document.getElementById("screenshot").addEventListener("change", function(e) {

    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(event) {
        const img = new Image();
        img.src = event.target.result;

        img.onload = function() {
            const canvas = document.createElement("canvas");
            const max = 1000;

            let w = img.width, h = img.height;
            if (w > h && w > max) { h *= max/w; w = max; }
            else if (h > max) { w *= max/h; h = max; }

            canvas.width = w;
            canvas.height = h;

            canvas.getContext("2d").drawImage(img, 0, 0, w, h);

            screenshotBase64 = canvas.toDataURL("image/jpeg", 0.7).split(",")[1];

            document.getElementById("preview").src = canvas.toDataURL("image/jpeg");
            document.getElementById("preview").style.display = "block";
        }
    };

    reader.readAsDataURL(file);
});

/* 2. Strict Event Logic */
function enforceRules(e) {

    const tCount = document.querySelectorAll(".tech:checked").length;
    const ntCount = document.querySelectorAll(".nontech:checked").length;
    const total = tCount + ntCount;

    if (tCount === 0 && ntCount > 0) {
        e.target.checked = false;
        alert("You must select at least 1 Technical event first! ❌");
        return;
    }

    if (tCount > 2 || ntCount > 2 || total > 3) {
        e.target.checked = false;
        alert("Rules: Max 2 Tech, Max 2 Non-Tech, Max 3 Total! ❌");
    }
}

document.querySelectorAll(".tech, .nontech")
    .forEach(cb => cb.addEventListener("change", enforceRules));

/* 3. Payment Flow (FIXED QR + MOBILE) */
document.getElementById("payBtn").onclick = () => {

    const tCount = document.querySelectorAll(".tech:checked").length;
    if (tCount === 0)
        return alert("Select at least 1 Technical event!");

    const upi = "upi://pay?pa=uvelimman434@oksbi&pn=CCET&am=250&cu=INR";

    document.getElementById("paymentArea").style.display = "block";

    const isMobile = /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);

    if (isMobile) {
        // 📱 Mobile → open UPI app ONLY (no QR)
        window.location.href = upi;
        document.getElementById("qrBox").style.display = "none";
    }
    else {
        // 💻 Desktop → show QR ONLY
        document.getElementById("qrBox").style.display = "block";

        document.getElementById("upiQR").src =
            "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=" +
            encodeURIComponent(upi);
    }
};

/* 4. Verify & Submit */

document.getElementById("verifyBtn").onclick = async () => {

    const utr = document.getElementById("utrInput").value.trim();
    if (utr.length < 8)
        return alert("Enter valid UTR");

    document.getElementById("loader").style.display = "block";

    const res = await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
            check_utr: utr,
            phone: document.getElementById("phone").value.trim(),
            email: document.getElementById("email").value.trim(),
            secret: SECRET
        })
    });

    const text = await res.text();

    document.getElementById("loader").style.display = "none";

    if (text === "OK") {
        isVerified = true;
        document.getElementById("submitBtn").disabled = false;
        alert("Payment Verified ✔");
    }
    else if (text === "DUPLICATE_UTR") {
        alert("This UTR already used ❌");
        isVerified = false;
    }
    else if (text === "DUPLICATE_PHONE") {
        alert("This Phone already registered ❌");
        isVerified = false;
    }
    else if (text === "DUPLICATE_EMAIL") {
        alert("This Email already registered ❌");
        isVerified = false;
    }
    else {
        alert("Verification Failed ❌");
        isVerified = false;
    }
};

/* Submit */

document.getElementById("submitBtn").onclick = async () => {

    if (!isVerified || !screenshotBase64)
        return alert("Verify payment & Upload screenshot!");

    document.getElementById("loader").style.display = "block";

    const data = {
        name: document.getElementById("name").value,
        phone: document.getElementById("phone").value,
        email: document.getElementById("email").value,
        college: document.getElementById("college").value,
        dept: document.getElementById("dept").value,
        year: document.getElementById("year").value,
        food: document.getElementById("food").value,
        tech_events: [...document.querySelectorAll(".tech:checked")].map(x=>x.value).join(","),
        nontech_events: [...document.querySelectorAll(".nontech:checked")].map(x=>x.value).join(","),
        upi_txn_id: document.getElementById("utrInput").value,
        screenshot: screenshotBase64,
        secret: SECRET
    };

    await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify(data)
    });

    alert("Registration Successful ✔");
    location.reload();
};

/* Poster Popup */
window.showPoster = (img) => {
    document.getElementById("posterImg").src = img;
    document.getElementById("posterModal").style.display = "flex";
};

window.closePoster = () => {
    document.getElementById("posterModal").style.display = "none";
};

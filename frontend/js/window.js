let prevTime = 0;
let loaded = false;

const ws = new WebSocket('ws://127.0.0.1:8080/');

ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);

    console.log(data);

    if(data.code === "RASPOTIFY_LOADED") {
        init(data);
    }

    if(data.code === "RASPOTIFY_NEW_SONG") {
        loadContent(data);
    }
}

const loadContent = async data => {
    const newCanvas = document.querySelector("#new-background-canvas");
    const canvas = document.querySelector("#background-canvas");
    const songArtist = document.querySelector(".song-artist");
    const songName = document.querySelector(".song-name");

    const albumImg = document.querySelector(".album-image");
    const newAlbumImg = document.querySelector(".album-image-new");

    const image = new Image();
    image.crossOrigin = "Anonymous";
    image.src = data.songInfo.albumURLs[2].url;

    new Promise(resolve => {
        const spans = Array.from(songName.getElementsByTagName('span')).concat(
            Array.from(songArtist.getElementsByTagName('span'))
        );

        if(spans.length !== 0) {
            let i = spans.length - 1;

            const removeWord = () => {
                const removeLetter = timestamp => {
                    if(spans[i].innerText.length !== 1) {
                        let a = spans[i].innerText.split('');
                        a.pop();

                        spans[i].innerText = a.join('');
                        setTimeout(requestAnimationFrame(removeLetter), 5);
                    }else{
                        i--;

                        if(i !== -1) {
                            removeWord();
                        }else{
                            setTimeout(resolve, 100);
                        }
                    }
                }

                requestAnimationFrame(removeLetter);
            }

            removeWord();
        }
    }).then(() => {
        const titleWords = data.songInfo.songName.split(' ');

        let artistName = "";
        data.songInfo.artistName.map((artist, index) => {
            artistName += artist.name;

            if(index !== data.songInfo.artistName.length - 1) {
                artistName += ", ";
            }
        });

        const artistWords = artistName.split(' ');

        songName.innerHTML = "";
        songArtist.innerHTML = "";
        if(titleWords.length !== 0 && artistWords.length !== 0) {
            artistWords.forEach(word => {
                songArtist.innerHTML = songArtist.innerHTML + "<span>" + word + "</span>";
            });

            titleWords.forEach(word => {
                songName.innerHTML = songName.innerHTML + "<span>" + word + " </span>";
            });

            const allWords = titleWords.concat(artistWords);

            const elements = Array.from(songName.getElementsByTagName('span')).concat(
                Array.from(songArtist.getElementsByTagName('span'))
            );

            for(let i = 0; i < elements.length; i++) {
                elements[i].style.width = elements[i].offsetWidth + "px";
                elements[i].style.height = elements[i].offsetHeight + "px";
                elements[i].innerHTML = "&lrm;";
            }

            let i = 0;
            const writeWord = () => {
                const letters = allWords[i].split('');

                let j = 0;
                const addLetter = timestamp => {
                    if(j < letters.length) {

                        elements[i].innerHTML += letters[j];
                        j++;

                        setTimeout(requestAnimationFrame(addLetter), 40);
                    }else{
                        i++;

                        if(i < elements.length) {
                            writeWord();
                        }
                    }
                }

                requestAnimationFrame(addLetter);
            }

            writeWord();
        }
    });

    image.onload = () => {
        StackBlur.image(image, newCanvas, 10, false);

        canvas.style.width = screen.width * 1.3 + "px";
        canvas.style.height = screen.width * 1.3 + "px";

        newCanvas.style.width = screen.width * 1.3 + "px";
        newCanvas.style.height = screen.width * 1.3 + "px";

        const animation = anime({
            targets: canvas,
            opacity: 0,
            easing: "easeInOutQuad",
            duration: 1500
          });

        animation.finished.then(() => {
           const dest = canvas.getContext('2d');
           dest.drawImage(newCanvas, 0, 0);

           canvas.style.opacity = "1";
        });
    };

    const albumImagePreload = new Image();
    albumImagePreload.src = data.songInfo.albumURLs[0].url;

    albumImagePreload.onload = () => {
        document.querySelector(".album-image-blurry-1").src = albumImagePreload.src;
        document.querySelector(".album-image-blurry-2").src = albumImagePreload.src;

        document.querySelector(".album-name").innerHTML = data.songInfo.albumName;

        newAlbumImg.src = albumImagePreload.src;
        animateAlbum();
    }

    axios.get("https://scannables.scdn.co/uri/plain/svg/24E07D/white/320/" + data.songInfo.uri).then(body => {
        const scancode = document.querySelector(".scancode");
        body = body.data;

        const parser = new DOMParser();
        const svg = parser.parseFromString(body, 'text/html');

        let initialTarget = scancode.getElementsByTagName('rect');
        initialTarget = Array.from(initialTarget);
        initialTarget.shift();

        initialTarget.forEach(target => {
            target.style.transformOrigin = "center";
        });

        const animation = anime({
            targets: initialTarget,
            scaleY: 0,
            duration: 500,
            easing: "easeInExpo"
        })

        animation.finished.then(() => {
            let newTargets = svg.getElementsByTagName('rect');
            newTargets = Array.from(newTargets);
            newTargets.shift();

            for(let i = 0; i < newTargets.length; i++) {
                initialTarget[i].style.height = newTargets[i].height.baseVal.value;
                initialTarget[i].style.y = newTargets[i].y.baseVal.value;
            }

            anime({
              targets: initialTarget,
              scaleY: 1,
              duration: 500,
              easing: 'easeOutExpo'
            });
        });
    });
};

const init = data => {
    const newCanvas = document.querySelector("#new-background-canvas");
    const canvas = document.querySelector("#background-canvas");
    const songArtist = document.querySelector(".song-artist");
    const songName = document.querySelector(".song-name");
    const albumImg = document.querySelector(".album-image");

    const image = new Image();
    image.crossOrigin = "Anonymous";
    image.src = data.songInfo.albumURLs[2].url;

    image.onload = () => {
        StackBlur.image(image, canvas, 10, false);

        canvas.style.width = screen.width * 1.3 + "px";
        canvas.style.height = screen.width * 1.3 + "px";

        newCanvas.style.width = screen.width * 1.3 + "px";
        newCanvas.style.height = screen.width * 1.3 + "px";
    };

    const albumImagePreload = new Image();
    albumImagePreload.src = data.songInfo.albumURLs[0].url;

    albumImagePreload.onload = () => {
        document.querySelector(".album-image-blurry-1").src = albumImagePreload.src;
        document.querySelector(".album-image-blurry-2").src = albumImagePreload.src;

        document.querySelector(".album-name").innerHTML = data.songInfo.albumName;

        albumImg.src = albumImagePreload.src;
    }

    const titleWords = data.songInfo.songName.split(' ');

    let artistName = '';
    data.songInfo.artists.map((artist, index) => {
       artistName += artist.name;

       if (index !== data.songInfo.artists.length - 1) {
           artistName += ', '
       }
    });

    const artistWords = artistName.split(' ');

    if (titleWords.length !== 0 && artistWords.length !== 0) {
        artistWords.forEach(word => {
            songArtist.innerHTML = songArtist.innerHTML + "<span>" + word + "</span>";
        });

        titleWords.forEach(word => {
            songName.innerHTML = songName.innerHTML + "<span>" + word + " </span>";
        });
    }

    axios.get("https://scannables.scdn.co/uri/plain/svg/24E07D/white/320/" + data.songInfo.uri).then(body => {
        const scancode = document.querySelector(".scancode");
        scancode.innerHTML = body.data;
    });

    fade();
}

const fade = () => {
    let op1 = 1;
    let op2 = 0;

    const timer = setInterval(function () {
        if (op1 <= 0.05){
            clearInterval(timer);
            document.querySelector(".loading").style.display = 'none';
        }

        document.querySelector(".loading").style.opacity = op1;
        op1 -= 0.05;

        document.querySelector(".main").style.opacity = op2;
        op2 += 0.05;
    }, 25);
};

const animateAlbum = () => {
    const min = Math.ceil(0);
    const max = Math.floor(3);
    const rand = Math.floor(Math.random() * (max - min + 1) + min);

    const albumImg = document.querySelector(".album-image");
    const newAlbumImg = document.querySelector(".album-image-new");
    const holderAlbumImg = document.querySelector(".album-image-holder");

    let anim;

    switch(rand) {
        case 0:
            anim = anime.timeline();

            anim.add({
                targets: [albumImg, newAlbumImg],
                duration: 500,
                borderRadius: 230,
                easing: 'easeInOutQuart'
            })
            .add({
                targets: holderAlbumImg,
                duration: 1000,
                rotate: 720,
                easing: 'easeInOutCubic'
            }, '-=300')
            .add({
                targets: albumImg,
                duration: 1000,
                opacity: 0,
                easing: 'easeInOutSine'
            }, '-=1000')
            .add({
                targets: [albumImg, newAlbumImg],
                duration: 500,
                borderRadius: 0,
                easing: 'easeInOutQuart'
            }, '-=300')
            break;
        case 1:
            anim = anime.timeline();

            anim.add({
                targets: holderAlbumImg,
                duration: 500,
                translateX: -700,
                easing: 'easeInSine'
            })
            .add({
                targets: albumImg,
                duration: 10,
                opacity: 0
            })
            .add({
                targets: holderAlbumImg,
                duration: 500,
                translateX: 0,
                easing: 'easeOutSine'
            })
            break;
        case 2:
            anim = anime.timeline();

            anim.add({
                targets: holderAlbumImg,
                duration: 1500,
                rotateX: -720,
                easing: 'easeInOutCubic'
            })
            .add({
                targets: albumImg,
                duration: 1,
                opacity: 0
            }, 750);
            break;
        case 3:
            anim = anime({
               targets: albumImg,
               opacity: 0,
               easing: 'easeInOutQuart',
               duration: 1500
            });
    }

    anim.finished.then(() => {
        holderAlbumImg.style.transform = "";

        albumImg.src = newAlbumImg.src;

        albumImg.style.opacity = "1";

        newAlbumImg.src = undefined;
    });
}


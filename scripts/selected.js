/*


 */
window.onload = function() {
    new Selected().init();
};
var Selected = function() {
    this.audio = document.getElementById('audio');
    this.lyricContainer = document.getElementById('lyricContainer');
    this.playlist = document.getElementById('playlist');
    this.currentIndex = 0;
    this.lyric = null;
    this.lyricStyle = 0; //
};
Selected.prototype = {
    constructor: Selected, //
    init: function() {
        
        this.initialList(this);

        var that = this,
            allSongs = this.playlist.children[0].children,
            currentSong, randomSong;

        //
        var songName = window.location.hash.substr(1);
        //then
        var indexOfHashSong = (function() {
            var index = 0;
            Array.prototype.forEach.call(allSongs, function(v, i, a) {
                if (v.children[0].getAttribute('data-name') == songName) {
                    index = i;
                    return false;
                }
            });
            return index;
        })();

        this.currentIndex = indexOfHashSong || Math.floor(Math.random() * allSongs.length);

        currentSong = allSongs[this.currentIndex];
        randomSong = currentSong.children[0].getAttribute('data-name');

        //
        window.location.hash = window.location.hash || randomSong;


        //handle playlist
        this.playlist.addEventListener('click', function(e) {
            if (e.target.nodeName.toLowerCase() !== 'a') {
                return;
            };
            var allSongs = that.playlist.children[0].children,
                selectedIndex = Array.prototype.indexOf.call(allSongs, e.target.parentNode);
            that.currentIndex = selectedIndex;
            that.setClass(selectedIndex);
            var songName = e.target.getAttribute('data-name');
            window.location.hash = songName;
            that.play(songName);
        }, false);
        this.audio.onended = function() {
            that.playNext(that);
        }
        this.audio.onerror = function(e) {
            that.lyricContainer.textContent = '!fail to load the song :(';
        };

        //
        window.addEventListener('keydown', function(e) {
            if (e.keyCode === 32) {
                if (that.audio.paused) {
                    that.audio.play();
                } else {
                    that.audio.pause();
                }
            }
        }, false);

        //背景顏色
        document.getElementById('bg_dark').addEventListener('click', function() {
            document.getElementsByTagName('html')[0].className = 'colorBg';
       });
        document.getElementById('bg_pic').addEventListener('click', function() {
            document.getElementsByTagName('html')[0].className = 'imageBg';
        });
        //背景顏色
        for (var i = allSongs.length - 1; i >= 0; i--) {
            allSongs[i].className = '';
        };
        currentSong.className = 'current-song';
        this.play(randomSong);
    },
    initialList: function(ctx) {
        var xhttp = new XMLHttpRequest();
        xhttp.open('GET', './scripts/content.json', false);
        xhttp.onreadystatechange = function() {
            if (xhttp.status == 200 && xhttp.readyState == 4) {
                var fragment = document.createDocumentFragment(),
                    data = JSON.parse(xhttp.responseText).data,
                    ol = ctx.playlist.getElementsByTagName('ol')[0],
                    fragment = document.createDocumentFragment();

                data.forEach(function(v, i, a) {
                    var li = document.createElement('li'),
                        a = document.createElement('a');                
                    //var t=document.createTextNode('<img src="" alt="安安">');
                    //span.appendChild(t);
                    a.href = 'javascript:void(0)';
                    a.dataset.name = v.lrc_name;
                    a.textContent = v.song_name + '-' + v.artist;                  
                    li.appendChild(a);
                    fragment.appendChild(li);
                });
                ol.appendChild(fragment);
            }
        };
        xhttp.send();
    },
    play: function(songName) {
        var that = this;
        this.audio.src ='./content/songs/' + songName + '.mp3';
        //問題點
        this.lyricContainer.style.top = '130px';
        //
        this.lyric = null;
        this.lyricContainer.textContent = 'loading...';
        this.lyricStyle = Math.floor(Math.random() * 4);
        this.audio.addEventListener('canplay', function() {
            that.getLyric(that.audio.src.replace('.mp3', '.lrc'));
            this.play();
        });
        //lyric
        this.audio.addEventListener("timeupdate", function(e) {
            if (!that.lyric) return;
            for (var i = 0, l = that.lyric.length; i < l; i++) {
                if (this.currentTime > that.lyric[i][0] - 0.50 /*preload the lyric by 0.50s*/ ) {
                    //
                    var line = document.getElementById('line-' + i),
                        prevLine = document.getElementById('line-' + (i > 0 ? i - 1 : i));
                    prevLine.className = '';
                    //
                    line.className = 'current-line-' + that.lyricStyle;
                    that.lyricContainer.style.top = 130 - line.offsetTop + 'px';
                };
            };
        });
    },
    playNext: function(that) {
        var allSongs = this.playlist.children[0].children,
            nextItem;
        //
        if (that.currentIndex === allSongs.length - 1) {
            //play from start
            that.currentIndex = 0;
        } else {
            //play next index
            that.currentIndex += 1;
        };
        nextItem = allSongs[that.currentIndex].children[0];
        that.setClass(that.currentIndex);
        var songName = nextItem.getAttribute('data-name');
        window.location.hash = songName;
        that.play(songName);
    },
    setClass: function(index) {
        var allSongs = this.playlist.children[0].children;
        for (var i = allSongs.length - 1; i >= 0; i--) {
            allSongs[i].className = '';
        };
        allSongs[index].className = 'current-song';
    },
    getLyric: function(url) {
        var that = this,
            request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'text';
        //
        request.onload = function() {
            that.lyric = that.parseLyric(request.response);
            //
            that.appendLyric(that.lyric);
        };
        request.onerror = request.onabort = function(e) {
            that.lyricContainer.textContent = '!failed to load the lyric :(';
        }
        this.lyricContainer.textContent = 'loading lyric...';
        request.send();
    },
    parseLyric: function(text) {
        //
        var lines = text.split('\n'),
            //this  [00.12.78]
            pattern = /\[\d{2}:\d{2}.\d{2}\]/g,
            result = [];

     
        var offset = this.getOffset(text);


        while (!pattern.test(lines[0])) {
            lines = lines.slice(1);
        };
        //remove the last empty item
        lines[lines.length - 1].length === 0 && lines.pop();
        //display all content on the page
        lines.forEach(function(v, i, a) {
            var time = v.match(pattern),
                value = v.replace(pattern, '');
            time.forEach(function(v1, i1, a1) {
                //convert the [min:sec] to secs format then store into result
                var t = v1.slice(1, -1).split(':');
                result.push([parseInt(t[0], 10) * 60 + parseFloat(t[1]) + parseInt(offset) / 1000, value]);
            });
        });
        //sort the result by time
        result.sort(function(a, b) {
            return a[0] - b[0];
        });
		console.log(result);
        return result;
    },
    appendLyric: function(lyric) {
        var that = this,
            lyricContainer = this.lyricContainer,
            fragment = document.createDocumentFragment();
        //clear the lyric container first
        this.lyricContainer.innerHTML = '';
        lyric.forEach(function(v, i, a) {
            var line = document.createElement('p');
            line.id = 'line-' + i;
            line.textContent = v[1];
            fragment.appendChild(line);
        });
        lyricContainer.appendChild(fragment);
    },
    getOffset: function(text) {

        var offset = 0;
        try {
            
            var offsetPattern = /\[offset:\-?\+?\d+\]/g,
             
                offset_line = text.match(offsetPattern)[0],
        
                offset_str = offset_line.split(':')[1];
        
            offset = parseInt(offset_str);
        } catch (err) {
      
            offset = 0;
        }
        return offset;
    }
};


/************************* 進度條******************/
var obtn=document.getElementById('obtn');
var fast=document.getElementById('fast');
var nofast=document.getElementById('nofast');
var small=document.getElementById('small');
var big=document.getElementById('big');


var next_song=document.getElementById('next_song');//下一手

var volume_music=0;

  small.onclick=function () {
      if(audio.volume > 0){
       	  audio.volume-=0.1; 
       	}else {return;}

    } //小聲
       big.onclick=function () {
       	if(audio.volume < 1){
       	    audio.volume +=0.1;  
       	}else{return;}
     }//大聲



    obtn.onclick=function () {
     if (audio.paused && audio.currentTime > 0 && !audio.ended) {
         audio.play();
         obtn.src="icon/Stop.png"
          
     } else {
         audio.pause(); 
         obtn.src="icon/Play.png" 
        
          
       
     }//暫停撥放
}
    
    nofast.onclick=function () {
     if (audio.paused && audio.currentTime > 0 && !audio.ended) {
     	return;  
     }else{
     	audio.currentTime-=15;
     }} //快轉15秒


    fast.onclick=function () {
     if (audio.paused && audio.currentTime > 0 && !audio.ended) {
     	return;  
     }else{
     	audio.currentTime+=15;
     }} //快轉15秒

     
     next_song.onclick=function () {
     if (audio.paused && audio.currentTime > 0 && !audio.ended) {
     	return;  
     }else{
     	audio.currentTime=audio.duration;
     }}//下一曲
 
 
 
/******進度條*******/

  const audio = document.getElementById('audio')
  const start = document.querySelector('.start')
  const end = document.querySelector('.end')
  const progressBar = document.querySelector('.progress-bar')
  const now = document.querySelector('.now')

  function conversion (value) {
    let minute = Math.floor(value / 60)
    minute = minute.toString().length === 1 ? ('0' + minute) : minute
    let second = Math.round(value % 60)
    second = second.toString().length === 1 ? ('0' + second) : second
    return `${minute}:${second}`
  }

  audio.onloadedmetadata = function () {
    end.innerHTML = conversion(audio.duration)
    start.innerHTML = conversion(audio.currentTime)
  }

  progressBar.addEventListener('click', function (event) {
    let coordStart = this.getBoundingClientRect().left
    let coordEnd = event.pageX
    let p = (coordEnd - coordStart) / this.offsetWidth
    now.style.width = p.toFixed(3) * 100 + '%'

    audio.currentTime = p * audio.duration
    audio.play()
  })

  setInterval(() => {
    start.innerHTML = conversion(audio.currentTime)
    now.style.width = audio.currentTime / audio.duration.toFixed(3) * 100 + '%'
  }, 1000)




  /**更改li**/

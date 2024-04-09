if ('serviceWorker' in navigator) {
	navigator.serviceWorker.register('./sw.js');
	navigator.serviceWorker.ready.then(reg => {
		const button = document.getElementById('notifications');
		button.addEventListener('click', () => {
		  Notification.requestPermission().then((result) => {
		    if (result === 'granted') {
		      randomNotification();
		    }
		  });
		});
		document.getElementById('syncBtn').addEventListener('click', () => {
			reg.sync.register('sync_task').then(() => {
				console.log('同步任务触发成功');
			}).catch(err => {
				console.log('同步任务触发失败', err);
			})
		})
		document.getElementById('fetchBtn').addEventListener('click', () => {
			$.ajax({
				type: 'post',
				url: 'http://127.0.0.1:3000/data',
				data: {
					name: 'gyp'
				},
				success: function(res) {
					console.log(res, '请求');
				},
				error: function (err) {
					console.log(err, '请求失败');
				}
			})
		})
	})
}

// Requesting permission for Notifications after clicking on the button

const btnClick = document.getElementById('open');
btnClick.addEventListener('click', () => {
	const divMark = document.getElementsByClassName('mark-index')[0];
	const firstPage = document.getElementsByClassName('pdam-first-page')[0];
	divMark.style.top = '100%';
	firstPage.style.filter = 'blur(0)';
})


// Setting up random Notification
function randomNotification() {
  // const randomItem = Math.floor(Math.random() * games.length);
  // const notifTitle = games[randomItem].name;
  const notifBody = `Created by gyp.`;
  const notifImg = `static/img/bg-new.png`;
  const options = {
    body: notifBody,
    icon: notifImg,
  };
  new Notification('高永鹏的通知', options);
}


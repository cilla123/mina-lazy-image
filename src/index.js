const temp = {
  listeners: {},
  timer: null
}

function addListener(key, handler) {
  if (key) {
    temp.listeners[key] = handler
  }
  if (!temp.timer) {
    temp.timer = setInterval(() => {
      Object.keys(temp.listeners).forEach((key) => {
        temp.listeners[key]()
      })
    }, 200)
  }
}

function removeListener(key) {
  if (key) {
    delete temp.listeners[key]
  }
  if (Object.keys(temp.listeners).length === 0 && temp.timer) {
    clearInterval(temp.timer)
    temp.timer = null
  }
}

Component({
  data: {
    supportObserver: !!wx.createIntersectionObserver,
    showed: false,
    id: ''
  },

  created() {
    if (!this.data.__id) {
      const id = Math.random()
        .toString(36)
        .substr(2, 9)
      this.data.__id = id
      temp[id] = {
        showedImages: [],
        observers: {},
        timer: null
      }
    }
  },

  ready() {
    if (!this.data.__id) {
      const id = Math.random()
        .toString(36)
        .substr(2, 9)
      this.data.__id = id
      temp[id] = {
        showedImages: [],
        observers: {},
        timer: null
      }
    }
    this.addObserver()
  },

  detached() {
    removeListener(this.data.__id)
    if (temp[this.data.__id].observers) {
      Object.keys(temp[this.data.__id].observers).forEach(key => {
        temp[this.data.__id].observers[key].disconnect()
      })
      temp[this.data.__id].observers = {}
    }
    delete temp[this.data.__id]
  },

  properties: {
    src: {
      type: String,
      value: '',
      observer(newVal, oldVal) {
        if (oldVal && temp[this.data.__id].showedImages) {
          const index = temp[this.data.__id].showedImages.indexOf(oldVal)
          if (index > -1) {
            temp[this.data.__id].showedImages.splice(index, 1)
            if (temp[this.data.__id].observers[oldVal]) {
              temp[this.data.__id].observers[oldVal].disconnect()
              temp[this.data.__id].observers[oldVal] = undefined
            }
          }
        }
        this.refreshView()
      }
    },
    styles: {
      type: String,
      value: ''
    },
    mode: {
      type: String,
      value: 'scaleToFill'
    }
  },

  methods: {
    onLoad() {
      console.log(`image ${this.properties.src} loaded`)
    },
    addImageObserver(target) {
      if (!target.src) {
        return
      }
      if (temp[this.data.__id].showedImages.indexOf(target.src) > -1) {
        return
      }
      const oid = target.src
      if (
        !temp[this.data.__id].observers[oid] &&
        temp[this.data.__id].showedImages.indexOf(target.src) === -1
      ) {
        console.log('add image observer', oid)
        temp[this.data.__id].observers[oid] = this.createIntersectionObserver()
        temp[this.data.__id].observers[oid]
          .relativeToViewport({bottom: 0})
          .observe('.preview-image', res => {
            if (
              res.dataset &&
              res.dataset.src &&
              this.data.__id &&
              temp[this.data.__id] &&
              temp[this.data.__id].showedImages.indexOf(res.dataset.src) === -1
            ) {
              temp[this.data.__id].showedImages = temp[
                this.data.__id
              ].showedImages.concat(res.dataset.src)
              temp[this.data.__id].observers[oid].disconnect()
              delete temp[this.data.__id].observers[oid]
              console.log(`show image: ${res.dataset.src}`)
              console.log('remove observer', oid)
              this.refreshView()
            }
          })
      }
    },
    addObserver() {
      const that = this
      async function check() {
        if (temp[that.data.__id].showedImages.indexOf(that.properties.src) > -1) {
          return
        }
        const exist = await new Promise(resolve => {
          that.createSelectorQuery()
            .select('.preview-image')
            .boundingClientRect(async rect => {
              resolve(rect)
            })
            .exec()
        })
        if (exist) {
          that.addImageObserver({
            src: that.properties.src
          })
        }
      }
      addListener(that.data.__id, check)
    },
    refreshView() {
      try {
        const currentImage = this.properties.src
        const showedImages = temp[this.data.__id].showedImages || []
        let showed = true
        if (showedImages.indexOf(currentImage) === -1) {
          showed = false
        }
        if (this.data.showed !== showed) {
          this.setData({
            showed
          })
        }
      } catch (e) {
        console.error(e)
      }
    }
  }
})

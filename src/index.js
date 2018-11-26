const temp = {}

Component({
  data: {
    supportObserver: !!wx.createIntersectionObserver,
    showed: false,
    id: ''
  },

  created() {
    const id = Math.random()
      .toString(36)
      .substr(2, 9)
    this.data.__id = id
    temp[id] = {
      showedImages: [],
      observers: {},
      timer: null
    }
  },

  ready() {
    this.addObserver()
  },

  detached() {
    if (temp[this.data.__id].timer) {
      clearTimeout(temp[this.data.__id].timer)
      temp[this.data.__id].timer = null
    }
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
      async function check() {
        const exist = await new Promise(resolve => {
          this.createSelectorQuery()
            .select('.preview-image')
            .boundingClientRect(async rect => {
              resolve(rect)
            })
            .exec()
        })
        if (exist) {
          this.addImageObserver({
            src: this.properties.src
          })
        }
        temp[this.data.__id].timer = setTimeout(() => {
          check.call(this)
        }, 350)
      }
      if (this.data.supportObserver) {
        temp[this.data.__id].timer = setTimeout(() => {
          check.call(this)
        }, 200)
      }
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

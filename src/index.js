Component({
  data: {
    supportObserver: !!wx.createIntersectionObserver,
    showed: false,
    previewSrc: ''
  },

  attached() {
    this.showedImages = []
    this.observers = {}
  },

  ready() {
    this.addObserver()
  },

  detached() {
    if (this.observerTimer) {
      clearTimeout(this.observerTimer)
      this.observerTimer = undefined
    }
    if (this.observers) {
      Object.keys(this.observers).forEach((key) => {
        this.observers[key].disconnect()
      })
      this.observers = undefined
    }
    this.showedImages = undefined
  },

  properties: {
    src: {
      type: String,
      value: '',
      observer(newVal, oldVal) {
        if (oldVal && this.showedImages) {
          const index = this.showedImages.indexOf(oldVal)
          if (index > -1) {
            this.showedImages.splice(index, 1)
            if (this.observers[oldVal]) {
              this.observers[oldVal].disconnect()
              this.observers[oldVal] = undefined
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
      if (this.showedImages.indexOf(target.src) > -1) {
        return
      }
      const oid = target.src
      if (
        !this.observers[oid] &&
        this.showedImages.indexOf(target.src) === -1
      ) {
        console.log('add image observer', oid)
        this.observers[oid] = this.createIntersectionObserver()
        this.observers[oid]
          .relativeToViewport({bottom: 0})
          .observe('.preview-image', res => {
            if (
              res.dataset &&
              res.dataset.src &&
              this.showedImages.indexOf(res.dataset.src) === -1
            ) {
              this.showedImages = this.showedImages.concat(res.dataset.src)
              this.observers[oid].disconnect()
              delete this.observers[oid]
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
        this.observerTimer = setTimeout(() => {
          check.call(this)
        }, 350)
      }
      if (this.data.supportObserver) {
        this.observerTimer = setTimeout(() => {
          check.call(this)
        }, 200)
      }
    },
    refreshView() {
      try {
        const currentImage = this.properties.src
        const showedImages = this.showedImages || []
        let showed = true
        if (showedImages.indexOf(currentImage) === -1) {
          showed = false
        }
        if (this.data.showed !== showed) {
          this.setData({
            showed,
            previewSrc: currentImage
          })
        }
      } catch (e) {
        console.error(e)
      }
    }
  }
})

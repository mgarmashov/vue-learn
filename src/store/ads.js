// import * as firebase from 'firebase'
import firebase from 'firebase/app'
import 'firebase/database'
import 'firebase/storage'

class Ad {
  constructor (title, description, ownerId, imageSrc = '', promo = false, id = null) {
    this.title = title
    this.description = description
    this.ownerId = ownerId
    this.imageSrc = imageSrc
    this.promo = promo
    this.id = id
  }
}

export default {
  state: {
    ads: [
      {title: '1st ad', description: '', promo: true, imageSrc: 'http://bm.img.com.ua/img/prikol/images/large/0/0/307600.jpg', id: '1'},
      {title: '2st ad', description: '', promo: false, imageSrc: 'https://bipbap.ru/wp-content/uploads/2017/10/0_8eb56_842bba74_XL.jpg', id: '2'},
      {title: '3st ad', description: '', promo: true, imageSrc: 'https://bipbap.ru/wp-content/uploads/2017/06/tmb_145037_6611.jpg', id: '3'},
      {title: '4st ad', description: '', promo: false, imageSrc: 'https://bipbap.ru/wp-content/uploads/2017/04/72fqw2qq3kxh.jpg', id: '4'},
      {title: '5st ad', description: '', promo: true, imageSrc: 'https://interesno-vse.ru/wp-content/uploads/morning_pic_1.jpg', id: '5'},
      {title: '6st ad', description: '', promo: false, imageSrc: 'https://images.aif.ru/007/410/7099f160be2419d6128e3a57e62ec326.jpg', id: '6'}
    ]
  },
  mutations: {
    createAd (state, payload) {
      state.ads.push(payload)
    },
    loadAds (state, payload) {
      state.ads = payload
    },
    updateAd (state, {title, description, id}) {
      const ad = state.ads.find(a => {
        return a.id === id
      })
      ad.title = title
      ad.description = description
    }
  },
  actions: {
    createAd: async function ({commit, getters}, payload) {
      commit('clearError')
      commit('setLoading', true)

      const image = payload.image
      try {
        const newAd = new Ad(
          payload.title,
          payload.description,
          getters.user.id,
          '',
          payload.promo
        )
        const ad = await firebase.database().ref('ads').push(newAd)
        const imageExt = image.name.slice(image.name.lastIndexOf('.'))

        const fileData = await firebase.storage().ref(`ads/${ad.key}${imageExt}`).put(image)
        const imageSrc = await fileData.ref.getDownloadURL()

        await firebase.database().ref('ads').child(ad.key).update({
          imageSrc
        })

        commit('setLoading', false)
        commit('createAd', {
          ...newAd,
          id: ad.key,
          imageSrc: imageSrc
        })
      } catch (error) {
        commit('setError', error.message)
        commit('setLoading', false)
        throw error
      }
    },
    async fetchAds ({commit}) {
      commit('clearError')
      commit('setLoading', true)
      const resultAds = []
      try {
        const fbVal = await firebase.database().ref('ads').once('value')
        const ads = fbVal.val()
        Object.keys(ads).forEach(key => {
          const ad = ads[key]
          resultAds.push(
            new Ad(
              ad.title,
              ad.description,
              ad.ownerId,
              ad.imageSrc,
              ad.promo,
              key
            )
          )
        })
        commit('loadAds', resultAds)
        commit('setLoading', false)
      } catch (error) {
        commit('setError', error.message)
        commit('setLoading', false)
        throw error
      }
    },
    async updateAd ({commit}, {title, description, id}) {
      commit('clearError')
      commit('setLoading', true)

      try {
        await firebase.database().ref('ads').child(id).update({
          title, description
        })
        commit('updateAd', {
          title, description, id
        })
        commit('setLoading', false)
      } catch (error) {
        commit('setError', error.message)
        commit('setLoading', false)
        throw error
      }
    }
  },
  getters: {
    ads (state) {
      return state.ads
    },
    promoAds (state) {
      return state.ads.filter(ad => {
        return ad.promo === true
      })
    },
    myAds (state, getters) {
      return state.ads.filter(ad => {
        return ad.ownerId === getters.user.id
      })
    },
    adById (state) {
      return adId => {
        return state.ads.find(ad => ad.id === adId)
      }
    }
  }
}

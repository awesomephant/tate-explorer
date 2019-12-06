export default {
    gri: function (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    sanitiseID: function (id) {
        return id.replace(' ', '-').toLowerCase()
    },

    joinEnglish: function (arr, key = false) {
        if (arr.length === 1) {
            if (key){
                return arr[0][key];
            } else {
                return arr[0];
            }
        } else if (arr.length === 2) {
            if (key){
                return `${arr[0][key]} and ${arr[1][key]}`;
            } else {
                return `${arr[0]} and ${arr[1]}`;
            }
        } else {
            let s = '';
            for (let i = 0; i < arr.length - 1; i++) {
                if (key){
                    s += `${arr[i][key]}, `
                } else {
                    s += `${arr[i]}, `
                }
            }
            if (key){
                s += `and ${arr[arr.length - 1][key]}`
            } else {
                s += `and ${arr[arr.length - 1]}`
            }
            return s;
        }
    }
}
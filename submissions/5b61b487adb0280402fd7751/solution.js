'use strict'; /*jslint node:true*/

module.exports = class Agent {
    constructor(me, counts, values, max_rounds, log){
        this.me = me === 1;
        this.counts = counts;
        this.values = values;
        this.rounds = max_rounds;
        this.log = log;
        this.total = 0;
        this.coolOffers = { '4false':9,
                            '3false':8,
                            '2false':8,
                            '1false':7,
                            '0false':7,
                            '4true':9,
                            '3true':8,
                            '2true':7,
                            '1true':5,
                            '0true':1 };
        // this.minScoreOfferFromOpp = {
        //     '4':7,
        //     '3':6,
        //     '2':6
        // };

        this.list = this.createList();
        this.cloneList = this.list.slice(0);
        for (let i = 0; i<counts.length; i++)
            this.total += counts[i] * values[i];
        this.oppOffer=this.opponentValues(counts);
    }




    offer(o) {
        this.log(`${this.rounds} rounds left`);
        this.log("list");
        for(let i = 0; i < this.list.length; i++){
            this.log(this.list[i][0] + "---" + this.list[i][1]);

        }
        this.log("the end");
        this.rounds--;
        let sum = 0;
    if(o) {
        if (this.getOppOff(o).reduce((prev, v, ind) => (v === 0) ? prev + 1 : prev, 0) === 1) {
            this.deleteAllWrongOffers(this.getOppOff(o).findIndex(v => v === 0));
        } else {
            if (this.getOppOff(o).reduce((prev, v) => (v == 0) ? prev + 1 : prev, 0) === 2) {
                    let fInd = this.getOppOff(o).findIndex(v => v !== 0)
                    for(let i = 0; i < this.oppOffer.length; i ++){
                        let maxCountsPerType = 0;
                        switch (this.rounds) {
                            case 4:
                                maxCountsPerType = 1;
                                break;
                            case 3:
                                maxCountsPerType = 2;
                                break;
                            default:
                                maxCountsPerType = 3;
                                break;
                        }
                        for(let j = 0; j < this.counts.length && j !== fInd; j++){
                        if(this.oppOffer.length > 1 && this.oppOffer[i][j]>maxCountsPerType){
                            this.oppOffer.splice(i,1);
                            break;
                        }
                    }

                }
            }else{
                let ind = [];
                for (let i = 0; i < this.counts.length; i++) {
                    if (this.counts[i] - this.getOppOff(o)[i] > 0) {
                        ind.push(i);
                    }
                }
                for (let index = 0; index < ind.length; index++) {
                    this.deleteSomeWrongOffers(ind[index],o);
                }
            }
        }
        sum = this.getSum(o);
    }
        if(this.coolOffers[this.rounds.toString()+this.me.toString()]<= sum)return;
        if (this.rounds === 4) {
                this.prevOf = this.offerNext();
                return this.offerNext();
        }
        return this.offerOneLess();
    }

    nowOneThingTrade() {
        return this.values.length - 1 === this.values.reduce((prev, cur, i) => {
            return (cur === 0) ? 1 + prev : prev;
        }, 0);
    }

    offerOneLess(){
        if(this.list.length<2)return this.offerNext();
        if(this.rounds<2&&!this.me){
            if(!this.createIdealOffer())this.list.shift();
            else return this.createIdealOffer();
        }else{
            this.list.shift();
        }
            return this.offerNext();
    }
    getSum(o){
        let sum = 0;
        for (let i = 0; i < o.length; i++)
            sum += this.values[i] * o[i];
        return sum;
    }
    offerNext(){
        return this.list[0][0];
    }
    createList() {
        let variants = this.counts.reduceRight(function(prev, item, index, counts) {
            let res = prev.slice();
            for (let i = 1; i <= item; i++) res = res.concat(prev.map(pi => counts.slice(0, index).map(r => 0).concat(i, pi.slice(index + 1))));
            return res;
        }, [this.counts.slice().map(r => 0)]);
        let summ = variants.map(v => (v.reduce((s, cv, ix) => (cv * this.values[ix] + s), 0)));
        let list = variants.map((v, ix) => [v, summ[ix]]);
        list.sort((a, b) => (b[1] - a[1] != 0 ? b[1] - a[1] : a[0].reduce((s, e) => (s + e), 0) - b[0].reduce((s, e) => (s + e), 0)));
        for(let i = 2; i < list.length; i ++){
            if(list[i][1]==list[i-1][1]&&list[i-2][1]==list[i-1][1]){
                list.splice(i ,1);
            }
        }
        for(let i = 0; i < this.values.length; i++){
            if(this.values[i]==0){
                for(let j = 0; j < list.length; j++){
                    if(list[j][0][i]!=0){
                        list[j][0][i]=0;
                        if(list[5][1]>4)list.splice(j,1);
                    }
                }
            }
        }
        if(this.nowOneThingTrade()){
            if(this.counts[this.values.findIndex((v)=>v!=0)]==1){
                for(let i = 0; i < list.length; i++){
                    if(list[i][1]<10){
                        list = list.slice(0, i);
                        break;
                    }
                }
            }else{
                for(let i = 0; i < list.length; i++){
                    if(list[i][1]<5){
                        list = list.slice(0, i);
                        break;
                    }
                }
            }
        }
        let maxV;
        maxV = this.values.reduce((prev,cur)=>{return (cur>prev)?cur:prev},0);
        if(maxV >= 6){
            for(let i = 0; i < list.length; i ++){
                if(list[i][1]<maxV){
                    list=list.slice(0,i);
                    break;
                }
            }
        }
        let nullInd = this.values.findIndex((v)=>v===0);
        if(nullInd>=0){
            for(let i = 0; i < list.length; i++){
                list[i][0][nullInd]=0;
            }
        }
        if(list[0][0].filter((V)=>V!==0).length==this.counts.length){
            list.splice(0,1);
        }
        return list;
    }
    getIndex(o){
        for (let i = 0; i < this.list.length; i++){
            if(o == this.list[i][0])return i;
        }
        return -1;
    }

    opponentValues(o) {
        let value = o;
        let variants = value.reduce(function(prev, item, index, counts) {
            let res = [];
                if(index===value.length-1){
                    for(let j = 0; j < prev.length; j++) {
                        let sum = 0;
                        for (let w = 0; w < prev[j].length; w++) sum += value[w] * prev[j][w];
                        if((10-sum)%item===0){
                            let temp = prev[j].concat((10 - sum)/item);
                            res.push(temp);
                        }
                    }
                }else if(index===0){
                    for (let i = 0; i <= 10/item; i++) res.push([i]);
                }else{
                    for(let j = 0; j < prev.length; j++) {
                        let sum = j * value[0];
                        for (let i = 0; i <= (10 - sum) / item; i++) {
                            let temp = prev[j].concat(i);
                            res.push(temp);
                        }
                }
            }
            return res;
        }, []);
        return variants;
    }
    getOppOff(o){
        return o.map((v,ind)=>this.counts[ind]-v);
    }

    deleteAllWrongOffers(ind) {
        let wall = 2;
        if(this.rounds>=3)wall = 0;
        for(let i = this.oppOffer.length-1; i >= 0 ; i--){
            if(this.oppOffer.length>1 && this.oppOffer[i][ind]>wall)this.oppOffer.splice(i,1);
        }
    }
    createIdealOffer(){
        let opV = this.oppOffer[~~(this.oppOffer.length/2)];
        let bestOffers = this.cloneList.map(v=>this.getOppOff(v[0]).reduce((prev,it,ind)=>(it*opV[ind]+prev),0));
        bestOffers = bestOffers.map((v,ind)=>[v].concat(this.cloneList[ind]));
        let minForOp = 0;
        let minForMe = 0;
        if (this.rounds === 4) {
            minForOp = 5;
            minForMe = 7;

        } else if (this.rounds === 3) {
            minForOp = 4;
            minForMe = 6;
        } else if (this.rounds === 1) {
            if (!this.me) {
                minForMe = 6;
                minForOp = 5;
            } else {
                minForMe = 4;
                minForOp = 5;
            }

        } else if (this.rounds === 2) {

            minForMe = 6;
            minForOp = 6;
        } else {
         
                if (!this.me) {
                    minForMe = 6;
                    minForOp = 4;
                } else {
                    return undefined;
                }

        }
       for(let i = bestOffers.length-1; i >= 0; i--){
           if(bestOffers[i][0]<minForOp||bestOffers[i][2]<minForMe)bestOffers.splice(i,1);
       }
        if(bestOffers.length>0){
        let theBest = bestOffers[0][1];
        return theBest;
        }else{
            return undefined;
        }
    }
    getOppSum(o,values){
        let sum = 0;
        for (let i = 0; i < o.length; i++)
            sum += values[i] * o[i];
        return sum;
    }

    deleteSomeWrongOffers(ind,o) {
        let inds = this.getOppOff(o).filter((v)=>v!=0);
        for(let j = 0; j < inds.length; j++) {
            if(inds[j]===ind)continue;
            for (let i = this.oppOffer.length - 1; i >= 0; i--) {
                if (this.oppOffer.length > 1 && (this.oppOffer[i][ind]>this.oppOffer[i][inds[j]]) ) this.oppOffer.splice(i, 1);
            }
        }
    }
};

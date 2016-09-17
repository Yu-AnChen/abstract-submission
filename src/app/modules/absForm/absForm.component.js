import template from './absForm.html';
import './absForm.styl';
var absFormConst = require('./absForm.constant.js')

const absFormComponent = {
    template,
    bindings: {

    },
    controller: /* @ngInject */
    class absFormInputController {
        static get $inject() {
            return ['$log', '$timeout', '$scope', '$interval', 'FormApi', 'UserApi', '$state', 'focus', '$stateParams'];
        }
        constructor($log, $timeout, $scope, $interval, FormApi, UserApi, $state, focus, $stateParams) {
            this.$log = $log;
            this.$timeout = $timeout;
            this.$scope = $scope;
            this.$interval = $interval;
            this.FormApi = FormApi;
            this.UserApi = UserApi;
            this.$state = $state;
            this.focus = focus;
            this.$stateParams = $stateParams;
        }
        $onInit() {
            this.absFormConst = absFormConst;
            this.buildForm();
            this.getCurrentUser();
            // this.form = this.getAbstractNewUser();
            this.fields = this.absFormConst.researchFields;
            
            this.autoBackupConfig = {
                status: false,
                time: 2000, // ms
                msg: 'DISABLED'
            }
            this.addOn = 0;
            this.AuthorAffilTemplate = this.genAuthorAffilTemplate();
            this.absWithinPage = true;
        }
        $onDestroy() {
            this.$interval.cancel(this.autoBackup);
        }
        
        detectAbsOverflowY(callback) {
            console.log("detectAbsOverflowY");
            var el = document.querySelector("#abs_print");
            if (el.scrollHeight > el.clientHeight) {
               this.absWithinPage = false; 
            } else { this.absWithinPage = true; }
            if (typeof callback === "function") {
                callback();
            }
        }
        buildForm() {
            this.UserApi.getCurrentUser().then((res)=>{
                this.getAbstract(res.data.email);
                // this.currentUser = true;
            },(res)=>{
                this.form = this.absFormConst.abstractNewUser;
                // this.currentUser = false;
            });
        }
        getCurrentUser() {
            this.UserApi.getCurrentUser().then((res)=>{
                // console.log(res.data);
                if (res.data.email) {
                    // this.$state.go('app.absForm', {email: res.data.email});
                    console.log(res.data.email);
                    this.currentUser = res.data;
                    // this.form.email = res.data.email;
                } else { 
                    this.currentUser =false; 
                }
            }, (res)=>{
                this.currentUser = false;
            });
        }
        
        submit(){
            console.log("submitting");
            console.log(this.form);
            this.form.submittedAt[0] = new Date();
            this.fillInAuthorAndAffil(()=>{
                this.decideUseAffiliationSup(()=>{
                    this.detectAbsOverflowY(()=>{
                        console.log(this.absWithinPage);
                        if (this.absWithinPage) { 
                           this.saveToDatabase(true); 
                        } 
                    });
                });
            });
        }
        saveToDatabase(submit){
            this.form.email = this.currentUser.email;
            this.form.updatedAt = new Date();
            this.FormApi.save(this.form).then((res)=>{
                console.log(res);
                if (res.data.ops) {
                    this.getAbstract(res.data.ops[0].email, res.data.ops[0].title);
                }
                if (submit) {
                    this.$state.go('app.absSubmitComplete')
                }
            });
        }
        getAbstract(email, title) {
            this.FormApi.get(email, title).then((res)=>{
                console.log('get data from server');
                // console.log(this.form._id);
                this.form = res.data[0];
                // console.log(this.form._id);
            }, ()=>{
                this.form = this.absFormConst.abstractNewUser;
            });
        }

        saveAndSignUp() {
            this.$state.go('app.user.signUp', {unsavedData: this.form});
            // this.FormApi.save(this.form).then((res)=>{
            //     console.log(res.data.ops[0]);
            // });
        }
        
        // DATA STRUCTURE
        getBlankForm() {
            return {
                email: "",
                title: "",
                field: "",
                authors: [{"name":"","role":"","affiliationSup":[NaN],"affiliationOfAuthor":[""],"validAuthor":false},{"name":"","role":"","affiliationSup":[NaN],"affiliationOfAuthor":[""],"validAuthor":false}],
                affiliations: [],
                useAffiliationSup: false,
                keywords: "",
                absContent: "",
                createdAt: new Date(),
                updatedAt: new Date(),
                submittedAt: []
            };
        }
        addAuthor() {
            let newAuthor = {
                name: "",
                role: this.genAuthorAffilTemplate()[this.form.authors.length],
                affiliationSup: [NaN],
                affiliationOfAuthor: [""],
                validAuthor: false
            }
            if (this.form.authors.length < 2) {
                this.form.authors.push(newAuthor);
            } else {
                // this.form.authors.splice(this.form.authors.length-1, 0, newAuthor);
            }
        }
        genAuthorAffilTemplate() {
            let AuthorAffilTemplate = ["Presenting", "Corresponding", "General"];
            for (let i=0; i<27; i++) {
                AuthorAffilTemplate.push(AuthorAffilTemplate[2]);
            }
            return AuthorAffilTemplate;
        }
        addAffiliation(authorIndex) {
            this.form.authors[authorIndex].affiliationSup.push(NaN);
        }
        // toTitleCase() {
        //     const toTitleCase = require('titlecase');
        //     this.form.title = toTitleCase(this.form.title);
        // }

        // TOOLS
        genUniqueArray(theArray) {
            let n = {},
              r = [];
            for (let i=0; i<theArray.length; i++) {
                if (!n[theArray[i]]) {
                    n[theArray[i]] = true;
                    r.push(theArray[i]);
                }
            }
            return r;
        }
        filterString(str) {
            // whitespaces have been trimed by angular
            if (str) { return str; }
        }

        // AUTHOR AND AFFILIATION
        // this.form.affiliations = [unique affiliations]
        checkAffilUnique() {
            console.log('checking');
            let affilRaw = [];
            for (let i=0; i<this.form.authors.length; i++) {
                affilRaw = affilRaw.concat(this.form.authors[i].affiliationOfAuthor);
            }
            let affilClean = affilRaw.filter(this.filterString);
            let affilUnique = this.genUniqueArray(affilClean);

            this.form.affiliations = affilUnique;
        }
        // match elements in author.affiliationOfAuthor with this.form.affiliations
        // to get the superscript number
        matchAffilSup() {
            for (let j=0; j<this.form.authors.length; j++) {
                for (let k=0; k<this.form.authors[j].affiliationOfAuthor.length; k++) {
                    let num = this.form.affiliations.indexOf(this.form.authors[j].affiliationOfAuthor[k]);
                    if (num>=0) {
                        this.form.authors[j].affiliationSup[k] = num+1;
                    }
                    if (num === -1) {
                        this.form.authors[j].affiliationSup[k] = NaN;
                    }
                }
            }
        }
        // true if the author has name or any affiliation
        validateAuthor() {
            for (let i=0; i<this.form.authors.length; i++) {
                this.form.authors[i].validAuthor = Boolean(
                    this.filterString(this.form.authors[i].name) ||
                    this.form.authors[i].affiliationOfAuthor.filter(this.filterString).length
                    )
            }
        }
        filterValidAuthor(author) {
            return author.validAuthor;
        }
        decideUseAffiliationSup(callback) {
            console.log('decideUseAffiliationSup');
            let validAuthors = this.form.authors.filter(this.filterValidAuthor);
            if (validAuthors.length > 1 && this.form.affiliations.length > 1) {
                this.form.useAffiliationSup = false;
                for (let i=0; i<validAuthors.length-1; i++) {
                    let supOne = validAuthors[i].affiliationSup.filter(this.filterString).sort();
                    let supTwo = validAuthors[i+1].affiliationSup.filter(this.filterString).sort();
                    if (supOne.length != supTwo.length) { this.form.useAffiliationSup = true; break; }
                    else {
                        for ( let j=0; j<supOne.length; j++) {
                            if (supOne[j] !== supTwo[j]) { this.form.useAffiliationSup = true; break; }
                        }
                    }
                }
            } else {
                this.form.useAffiliationSup = false;
            }
            if (typeof callback == "function") {
                callback();
            }
        }
        matchAuthor(name){
            this.filteredAuthors=[];
            let newfilteredAuthors = [];
            for(let x=0; x<this.form.authors.length; x++){
                this.filteredAuthors.push(this.form.authors[x].name);
            }
            console.log(this.filteredAuthors);
            for(let i=0; i<this.filteredAuthors.length; i++) {
                const pos = this.filteredAuthors[i].indexOf(name);
                if (pos > -1){
                    newfilteredAuthors.push(this.filteredAuthors[i]);
                }
            }
            this.filteredAuthors = newfilteredAuthors;
        }
        fillInAuthorAndAffil(callback) {
            console.log('fillInAuthorAndAffil');
            for (let i=0; i<this.form.authors.length; i++) {
                if (this.filterString(this.form.authors[i].name)) {
                    if (!this.form.authors[i].affiliationOfAuthor.filter(this.filterString).length) {
                        this.form.authors[i].affiliationOfAuthor[0] = "Unknown Affiliation";
                        this.checkAffilUnique();
                        this.matchAffilSup();
                    }
                } else {
                    if (this.form.authors[i].affiliationOfAuthor.filter(this.filterString).length) {
                        this.form.authors[i].name = "Unknown Author";
                    }
                }
            }
            // this.decideUseAffiliationSup();
            if (typeof callback == "function") {
                callback();
            }
        }
        // FIELDS
        getFields() {
            return [
                "Translational biology", 
                "Developmental biology", 
                "Neuroscience", 
                "Bioinformatics", 
                "Bioengineering", 
                "Biostatistics", 
                "Immunology", 
                "Molecule biology", 
                "Microbiology", 
                "Genetics", 
                "Biophysics", 
                "Biochemistry", 
                "Pharmacology"
            ]
        }
        // DATABASE
        toggleAutoBackup() {
            if (this.autoBackupConfig.status) {
                this.autoBackupConfig.msg = 'Changes saved';
                this.autoBackup = this.$interval(()=>{
                    console.log('save');
                    this.addOn ++;
                    this.saveToDatabase(false);
                }, this.autoBackupConfig.time);
            } else {
                this.autoBackupConfig.msg = 'DISABLED';
                this.$interval.cancel(this.autoBackup);
            }
        }
        goSignUp() {
            this.$state.go('app.user.signIn');
        }
        // UI
        focusNewAuthor() {
            this.focus('author-name-'+(this.form.authors.length-2));
        }
        focusNewAffiliation(authorIndex) {
            console.log(authorIndex);
            this.focus('author-'+authorIndex+'-affiliation-'+(this.form.authors[authorIndex].affiliationSup.length-1))
            // 'author-'+parentIndex+'-affiliation-'+(this.form.authors[parentIndex].affiliationSup.length-2)
        }

    }
};
export default absFormComponent;
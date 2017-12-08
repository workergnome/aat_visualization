class AATApi {

  static getTerm(entity, opts = {}) {
     if(!entity && entity.identified_by) {return null};
     let terms = entity.identified_by
     if (opts.language) {
       let newTerms = []
       for (const lang of opts.language) {
         newTerms = terms.filter(term => term.language == lang)
         if (newTerms.length) {
           break;
         }
       }
       terms = newTerms
     }
     if (terms.length) {
       return terms[0].value
     }
     else if (opts.allowFallback) {
       return entity.label
     }
     return null;
   }
}

export default AATApi
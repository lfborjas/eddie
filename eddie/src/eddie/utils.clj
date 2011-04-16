(ns eddie.utils)

;these two from:
;    from http://clojuredocs.org/clojure_core/clojure.core/print-dup

(defn- frm-save 
  "Save a clojure form to the specified file"
  [file form]
  (with-open 
    [w (java.io.FileWriter. file)] 
    (binding [*out* w *print-dup* true] (prn form))))

(defn- frm-load 
  "Load a clojure form from the specified file, nil if not found"
  [fname]
  (try 
    (with-open 
      [r (java.io.PushbackReader. (java.io.FileReader. fname))]
      (read r))
    (catch Exception e 'nil)))
  
;yayness, I used let-over-lambda!
;usage: 
;to store stuff: ((shelve "zalgo") (uuid/uuid) {:zalgo 'zalgo2})
;to retrieve stuff: ((shelve "zalgo") "c2ab6621-7505-4e9f-892c-1aeb80d40d1f")

(defn shelve
  "Use the specified file to persist a store, the poor, hasty man's mimic of python's shelve module"
  [fname]
  (let [store (or (frm-load fname) {})]
    (fn 
      ;look ma, dispatch by arity!
      ([key] (get store key))
      ([key value] (frm-save fname (assoc store key value))))))

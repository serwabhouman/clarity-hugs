;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; error codes
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(define-map error-string uint (string-ascii 80))
(define-constant SENDER_DOESNOT_OWN_ASSET u1)
(map-insert error-string SENDER_DOESNOT_OWN_ASSET "sender does not own the asset")
(define-constant SAME_SENDER_RECIPIENT u2)
(map-insert error-string SAME_SENDER_RECIPIENT "sender and recipient are the same principal")
(define-constant NFT_DOESNOT_EXIST u3)
(map-insert error-string NFT_DOESNOT_EXIST "asset identified by the id does not exist")
(define-constant INVALID_GROUP_CREATOR u4)
(map-insert error-string INVALID_GROUP_CREATOR "only the creator of the group can mint new NFTs")
(define-constant GROUP_DOESNOT_EXIST u5)
(map-insert error-string GROUP_DOESNOT_EXIST "the group with group id does not exist")
(define-constant FAILED_TO_ADD_GROUP u6)
(map-insert error-string FAILED_TO_ADD_GROUP "failed to add new NFT group")
(define-constant FAILED_TO_SET_GROUP_ID u7)
(map-insert error-string FAILED_TO_SET_GROUP_ID "failed to set new NFT group id")
(define-constant INVALID_CREATOR u8)
(map-insert error-string INVALID_CREATOR "the creator must be either tx-sender or contract-caller")
(define-constant NFT_ALREADY_IN_USE u9)
(map-insert error-string NFT_ALREADY_IN_USE "NFT id is already in use")
(define-constant FAILED_TO_ADD_METADATA u10)
(map-insert error-string FAILED_TO_ADD_METADATA "failed to add metadata details")
(define-constant FAILED_TO_SET_LAST_ID u11)
(map-insert error-string FAILED_TO_SET_LAST_ID "failed to update last NFT id")
(define-constant TRANSFER_PERMISSION_DENIED u12)
(map-insert error-string TRANSFER_PERMISSION_DENIED "the caller is not allowed to call transfer on the specified NFT")
(define-constant APPROVAL_PERMISSION_DENIED u13)
(map-insert error-string APPROVAL_PERMISSION_DENIED "only owner can update the approval")
(define-constant FAILED_TO_UPDATE_APPROVAL u14)
(map-insert error-string FAILED_TO_UPDATE_APPROVAL "failed to set the approval")
(define-constant FAILED_TO_UPDATE_BALANCE u15)
(map-insert error-string FAILED_TO_UPDATE_BALANCE "failed to update the balance")
(define-constant FAILED_TO_GET_OWNER u16)
(map-insert error-string FAILED_TO_GET_OWNER "failed to get the owner of the token")
(define-constant SAME_SPENDER u17)
(map-insert error-string SAME_SPENDER "spender specified is same as the caller")
(define-constant SAME_OPERATOR u17)
(map-insert error-string SAME_OPERATOR "operator specified is same as the tx-sender")
(define-constant INVALID_PARAMETERS u18)
(map-insert error-string INVALID_PARAMETERS "invalid parameters")

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; definitions
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; SIP-009 trait
(define-trait nft-trait  
   ((get-last-token-id () (response uint uint)) 
    (get-token-uri (uint) (response (optional (string-ascii 256)) uint))  
    (get-owner (uint) (response (optional principal) uint))   
    (transfer (uint principal principal) (response bool uint)))) 

(define-non-fungible-token hugs uint)

(define-data-var last-id uint u0)

(define-data-var last-group-id uint u0)

(define-map metadata uint
  {
    creator: principal,
    uri: (string-ascii 256),
    group-id: uint
  }
) 

(define-map group-metadata uint
  {
    creator: principal,
    uri: (string-ascii 256),
    count: uint
  }
)

(define-map group-tokens 
  {
   group-id: uint,
   index: uint
  }
  uint
)

(define-map uris (string-ascii 256) uint)

(define-map spenders uint principal)

(define-map balances principal uint)

(define-map operators { owner: principal, operator: principal } bool)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; private functions
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(define-private (is-caller (p principal)) 
  (or (is-eq p tx-sender) (is-eq p contract-caller)))

(define-private (is-owner (id uint) (p principal)) 
  (match (nft-get-owner? hugs id) owner (is-eq owner p) false))

(define-private (can-transfer (id uint) (actor principal))
  (or
   (is-owner id actor)
   (is-spender-approved id actor)
   (is-operator-approved (unwrap! (nft-get-owner? hugs id) false) actor)))

(define-private (can-mint-in-existing-group (group-id uint) 
                                            (creator principal))               
  (match (map-get? group-metadata group-id) entry
          (begin 
            (asserts! (is-eq creator (get creator entry)) (err INVALID_GROUP_CREATOR))
            (ok group-id))
          (err GROUP_DOESNOT_EXIST)))
  
(define-private (get-group-id (creator principal)
                              (group  { id: (optional uint),
                                        uri: (optional (string-ascii 256))}))
  (match (get id group) id 
    (can-mint-in-existing-group id creator)
    (let ((group-id (+ u1 (var-get last-group-id))) 
          (group-uri (match (get uri group) uri uri "")))
      (begin 
        (asserts! (> (len group-uri) u0) (err INVALID_PARAMETERS))
        (asserts! (map-insert group-metadata group-id { creator: creator,
                                                        count: u0,
                                                        uri: group-uri }) (err FAILED_TO_ADD_GROUP))
        (asserts! (var-set last-group-id group-id) (err FAILED_TO_SET_GROUP_ID)) 
        (ok group-id)))))

(define-private (increment-token-count-in-group (group-id uint) (count uint))
  (match (map-get? group-metadata group-id) entry
          (begin 
            (asserts! (map-set group-metadata group-id { creator: (get creator entry),
                                                         count: count,
                                                         uri: (get uri entry) }) (err FAILED_TO_ADD_GROUP))
            (ok true))
          (err GROUP_DOESNOT_EXIST)))


(define-private (get-token-count-in-group (group-id uint))
  (match (map-get? group-metadata group-id) entry
          (get count entry)
          u0))


(define-private (transfer-internal (id uint) (context 
                                                (response { count: uint, 
                                                            sender: principal, 
                                                            recipient: principal } uint)))
  (let ((previous (unwrap! context context)))
    (let ((sender (get sender previous)) (recipient (get recipient previous)) (count (get count previous))) 
      (match 
          (transfer id sender recipient)
          result
          (ok {count: (+ u1 count), sender: sender, recipient: recipient}) 
          err-value
          (err err-value)))))

(define-private (mint-internal (meta 
                        { uri: (string-ascii 256)}) 
                      (context (response { creator: principal, 
                                           group-id: uint, 
                                           count: uint, 
                                           ids: (list 100 uint)} uint)))
  (let ((previous (unwrap! context context))  
        (uri (get uri meta)))
    (let ((creator (get creator previous))
          (group-id (get group-id previous))
          (count (get count previous))
          (ids (get ids previous)))
      (begin
        (match  (mint creator uri group-id) id
                (let ((index (+ u1 count)))
                  (let ((result (ok { creator: creator, 
                                      group-id: group-id, 
                                      count: index, 
                                      ids: (unwrap-panic (as-max-len? (append ids id) u100))}) ))
                    (if (> group-id u0) 
                        (if (map-insert group-tokens { group-id: group-id, index: index } id)
                            result
                            (err FAILED_TO_ADD_METADATA))
                        result
                    )
                  )
                ) 
                err-value
                (err err-value))
        ))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; public functions
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(define-public (mint (creator principal) (uri (string-ascii 256)) (group-id uint))
  (let ((id (+ u1 (var-get last-id))))
    (begin
        (asserts! (and (> (len uri) u0) (is-none (map-get? uris uri))) (err INVALID_PARAMETERS))
        (unwrap! (nft-mint? hugs id creator) (err NFT_ALREADY_IN_USE))
        (asserts! (map-insert metadata id 
                             {  creator: creator,
                                uri: uri,
                                group-id: group-id}) (err FAILED_TO_ADD_METADATA))
        (asserts! (map-insert uris uri id) (err FAILED_TO_ADD_METADATA))
        (asserts! (map-set balances creator (+ u1 (get-balance creator))) (err FAILED_TO_UPDATE_BALANCE))
        (asserts! (var-set last-id id) (err FAILED_TO_SET_LAST_ID))
        (ok id))))

(define-public (mint-batch (creator principal) 
                           (group-info (optional {  
                                                    id: (optional uint), 
                                                    uri: (optional (string-ascii 256))}))
                           (nfts (list 100  { uri: (string-ascii 256) })))
  (begin 
    (asserts! (is-caller creator) (err INVALID_CREATOR)) 
    (let ((group-id (match group-info group (try! (get-group-id creator group)) u0)))
      (let ((result (fold mint-internal nfts (ok {  creator: creator, 
                                                    group-id: group-id, 
                                                    count: (get-token-count-in-group group-id), 
                                                    ids: (list)}))))
        (match 
          result 
          res 
          (let ((ids (get ids res) ))
            (if (> group-id u0)
              (match 
                (increment-token-count-in-group group-id (get count res)) 
                inc-res
                (ok ids)
                err-val 
                (err err-val)
              )
              (ok ids)             
            )               
          )
          error
          (err error)
        )
      ))))


(define-public (transfer (id uint) (sender principal) (recipient principal))
  (let ((sender-balance (get-balance sender)) (recipient-balance (get-balance recipient)))
    (begin 
      (asserts! (or (can-transfer id tx-sender) (can-transfer id contract-caller)) (err TRANSFER_PERMISSION_DENIED))
      (match 
        (nft-transfer? hugs id sender recipient) 
        result
        (if (and (map-set balances sender (- sender-balance u1))
                (map-set balances recipient (+ recipient-balance u1))) 
            (ok result)
            (err FAILED_TO_UPDATE_BALANCE))
        err-value
        (err err-value)
      ))))


(define-public (transfer-batch (ids (list 100 uint)) (sender principal) (recipient principal))
  (fold transfer-internal ids (ok {count: u0, sender: sender, recipient: recipient})))

(define-public (set-spender-approval (id uint) (spender principal) (is-approved bool))
  (let ((owner (unwrap! (nft-get-owner? hugs id) (err FAILED_TO_GET_OWNER))))
      (asserts! (is-caller owner) (err APPROVAL_PERMISSION_DENIED))
      (asserts! (not (is-eq owner spender)) (err SAME_SPENDER))
      (if is-approved 
          (if 
            (map-set spenders id spender) 
            (ok true) 
            (err FAILED_TO_UPDATE_APPROVAL)) 
          (begin 
             (map-delete spenders id) 
             (ok true)))))

(define-read-only (is-spender-approved (id uint) (spender principal))
  (match (map-get? spenders id) approved (is-eq approved spender) false))

(define-public (set-operator-approval (owner principal) (operator principal) (is-approved bool))
  (begin
    (asserts! (is-caller owner) (err APPROVAL_PERMISSION_DENIED)) 
    (asserts! (not (is-eq operator owner)) (err SAME_OPERATOR))
    (asserts! 
        (map-set operators { owner: owner, operator: operator } is-approved) 
        (err FAILED_TO_UPDATE_APPROVAL))
    (ok true)))

(define-read-only (is-operator-approved (owner principal) (operator principal))
  (unwrap! (map-get? operators { owner: owner, operator: operator }) false))
  
(define-read-only (get-balance (owner principal))
  (match (map-get? balances owner) balance balance u0))
  
(define-read-only  (get-last-token-id)
  (ok (var-get last-id)))

(define-read-only (get-owner (id uint))
  (ok (nft-get-owner? hugs id)))

(define-read-only (get-token-uri (id uint))
  (ok (match (map-get? metadata id) meta (some (get uri meta)) none)))

(define-read-only (get-errstr (code uint)) 
  (ok (map-get? error-string code)))

(define-read-only (get-token-metadata (id uint))
  (map-get? metadata id))

(define-read-only (get-token-id (uri (string-ascii 256)))
  (match (map-get? uris uri) id id u0))

(define-read-only (get-group-metadata (group-id uint))
  (map-get? group-metadata group-id))

(define-read-only (get-token-by-index (group-id uint) (index uint))
  (match 
    (map-get? group-tokens { group-id: group-id, index: index }) 
    id 
    (match (map-get? metadata id) meta (some { id: id, meta: meta }) none) 
    none))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; end
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
# Goloka Backend — Member (Client) CRUD Spec

The Mandala frontend needs full CRUD for members. Members are stored as `Client` records. The `Client.Client` JSON field holds all member data. The `Client.Archived` boolean is a hard filter (true = hidden from all queries).

## Member JSON Schema

```json
{
  "first_name": "Elina",
  "last_name": "Chadina",
  "email": "elinachadina@gmail.com",
  "phone": "+1 438 931-12-55",
  "address": "23 rue Des Ancolies\nL'ile-Perrot QC J7V9L6",
  "role": "Devotee",
  "joined": "2024-01-15",
  "notes": "Sunday feast kitchen lead",
  "status": "",

  "initiated_name": "",
  "diksa_guru": "Chaitanya Chandra Charan Das",
  "guiding_devotee": "Narasimha Priya dd",
  "dob": "1977-09-15",
  "gender": "Female",
  "nationality": "Russian",
  "occupation": "Doctor",
  "marriage_status": "Married",
  "spouse": "Alexey Ambartsumov",
  "spouse_kc": "Friend of Krishna, helping",
  "children": "Andrei 20yo, Maria Rosa 16yo",
  "services": "Cooking for Krishna, helping pujari, cleaning kitchen",
  "rounds": 16,
  "rounds_years": 4,
  "four_regs": true,
  "four_regs_years": 11,
  "kc_years": 12,
  "lives_in_temple": false,
  "temple": "ISKCON Montreal",
  "namahatta": true
}
```

`status` is free-text: empty = active, "Moved away", "Passed away", "Left community", etc.

## 1. New Handlers — `internal/handlers/client.go`

### CreateClient (POST /api/clients)

```go
func (h *Handler) CreateClient(c *gin.Context) {
    var body json.RawMessage
    if err := c.ShouldBindJSON(&body); err != nil {
        c.JSON(400, gin.H{"error": "Invalid input"})
        return
    }
    client := models.Client{
        PublicID: uuid.New().String(),
        Client:   datatypes.JSON(body),
    }
    if err := h.DB.Create(&client).Error; err != nil {
        c.JSON(500, gin.H{"error": "Failed to create member"})
        return
    }
    c.JSON(201, client)
}
```

### GetClient (GET /api/clients/:id)

```go
func (h *Handler) GetClient(c *gin.Context) {
    id := c.Param("id")
    var client models.Client
    if err := h.DB.Where("client_id = ? AND archived = 0", id).First(&client).Error; err != nil {
        c.JSON(404, gin.H{"error": "Member not found"})
        return
    }
    c.JSON(200, client)
}
```

### UpdateClient (PUT /api/clients/:id)

```go
func (h *Handler) UpdateClient(c *gin.Context) {
    id := c.Param("id")
    var client models.Client
    if err := h.DB.Where("client_id = ? AND archived = 0", id).First(&client).Error; err != nil {
        c.JSON(404, gin.H{"error": "Member not found"})
        return
    }
    var body json.RawMessage
    if err := c.ShouldBindJSON(&body); err != nil {
        c.JSON(400, gin.H{"error": "Invalid input"})
        return
    }
    client.Client = datatypes.JSON(body)
    if err := h.DB.Save(&client).Error; err != nil {
        c.JSON(500, gin.H{"error": "Failed to update member"})
        return
    }
    c.JSON(200, client)
}
```

### ArchiveClient (DELETE /api/clients/:id)

Soft-delete: sets `archived = true`.

```go
func (h *Handler) ArchiveClient(c *gin.Context) {
    id := c.Param("id")
    result := h.DB.Model(&models.Client{}).Where("client_id = ?", id).Update("archived", true)
    if result.RowsAffected == 0 {
        c.JSON(404, gin.H{"error": "Member not found"})
        return
    }
    c.NoContent()
}
```

## 2. Update existing GetClients

The existing `GetClients` handler already paginates. Add `archived = 0` filter so archived members are excluded by default. Add `client.phone` and `client.email` to searchable fields.

## 3. Routes — `internal/routes/routes.go`

```go
api.POST("/clients", middleware.RequirePermission("clients:create"), h.CreateClient)
api.GET("/clients/:id", middleware.RequirePermission("clients:view"), h.GetClient)
api.PUT("/clients/:id", middleware.RequirePermission("clients:create"), h.UpdateClient)
api.DELETE("/clients/:id", middleware.RequirePermission("clients:create"), h.ArchiveClient)
```

## 4. Permissions — `internal/cli/seed.go`

Add: `{5, "clients:create"}`

Update role permissions:
- Administrator: `"1,2,3,4,5"`
- Treasurer: `"1,3,5"`

## 5. Seed Sample Clients — `internal/cli/seed.go`

```go
var clients = []string{
    `{"first_name":"Radha","last_name":"Sharma","email":"radha.sharma@gmail.com","phone":"514-555-0101","role":"Board Member","joined":"2019-03-15","address":"1234 Rue Saint-Denis, Montréal","notes":"","services":"Temple management","rounds":16,"four_regs":true}`,
    `{"first_name":"Govinda","last_name":"Patel","email":"govinda.p@outlook.com","phone":"514-555-0102","role":"Treasurer","joined":"2020-06-01","address":"567 Ave du Parc, Montréal","notes":"Handles all bank deposits","occupation":"Accountant"}`,
    `{"first_name":"Yamuna","last_name":"Devi","email":"yamuna.d@gmail.com","phone":"514-555-0103","role":"Volunteer","joined":"2021-01-10","notes":"Sunday feast kitchen lead","services":"Cooking for Krishna","rounds":16,"four_regs":true}`,
    `{"first_name":"Elina","last_name":"Chadina","email":"elinachadina@gmail.com","phone":"+1 438 931-12-55","role":"Devotee","joined":"2024-01-15","address":"23 rue Des Ancolies\nL'ile-Perrot QC J7V9L6","diksa_guru":"Chaitanya Chandra Charan Das","guiding_devotee":"Narasimha Priya dd","dob":"1977-09-15","gender":"Female","nationality":"Russian","occupation":"Doctor","marriage_status":"Married","spouse":"Alexey Ambartsumov","spouse_kc":"Friend of Krishna, helping","children":"Andrei 20yo, Maria Rosa 16yo","services":"Cooking for Krishna, helping pujari, cleaning kitchen","rounds":16,"rounds_years":4,"four_regs":true,"four_regs_years":11,"kc_years":12,"temple":"ISKCON Montreal","namahatta":true}`,
}
```

Seed with `PublicID = uuid.New().String()`.

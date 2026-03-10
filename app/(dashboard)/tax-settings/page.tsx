"use client"

import { useState } from "react"
import { useTaxConfig, type TaxJurisdiction, type TaxRule } from "@/components/tax-config-provider"
import { useLanguage } from "@/components/language-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { SwitchRow } from "@/components/ui/switch-row"
import { Badge } from "@/components/ui/badge"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import { Plus, Edit, Trash2, Check, Calculator } from "lucide-react"

export default function TaxSettingsPage() {
  const { t } = useLanguage()
  const {
    taxJurisdictions,
    currentJurisdiction,
    setCurrentJurisdiction,
    addJurisdiction,
    updateJurisdiction,
    removeJurisdiction,
    addTaxRule,
    updateTaxRule,
    removeTaxRule,
  } = useTaxConfig()

  const [isAddJurisdictionOpen, setIsAddJurisdictionOpen] = useState(false)
  const [isEditJurisdictionOpen, setIsEditJurisdictionOpen] = useState(false)
  const [isAddRuleOpen, setIsAddRuleOpen] = useState(false)
  const [isEditRuleOpen, setIsEditRuleOpen] = useState(false)

  const [currentJurisdictionEdit, setCurrentJurisdictionEdit] = useState<TaxJurisdiction | null>(null)
  const [currentRuleEdit, setCurrentRuleEdit] = useState<TaxRule | null>(null)

  const [newJurisdiction, setNewJurisdiction] = useState<Omit<TaxJurisdiction, "id">>({
    name: "",
    code: "",
    rules: [],
  })

  const [newRule, setNewRule] = useState<Omit<TaxRule, "id">>({
    name: "",
    rate: 0,
    isDefault: false,
    appliesTo: "all",
    isExempt: false,
  })

  const handleAddJurisdiction = () => {
    addJurisdiction(newJurisdiction)
    setNewJurisdiction({
      name: "",
      code: "",
      rules: [],
    })
    setIsAddJurisdictionOpen(false)
  }

  const handleEditJurisdiction = () => {
    if (!currentJurisdictionEdit) return
    updateJurisdiction(currentJurisdictionEdit)
    setIsEditJurisdictionOpen(false)
    setCurrentJurisdictionEdit(null)
  }

  const handleAddRule = () => {
    if (!currentJurisdiction) return
    addTaxRule(currentJurisdiction.id, newRule)
    setNewRule({
      name: "",
      rate: 0,
      isDefault: false,
      appliesTo: "all",
      isExempt: false,
    })
    setIsAddRuleOpen(false)
  }

  const handleEditRule = () => {
    if (!currentJurisdiction || !currentRuleEdit) return
    updateTaxRule(currentJurisdiction.id, currentRuleEdit)
    setIsEditRuleOpen(false)
    setCurrentRuleEdit(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("tax.title")}</h1>
          <p className="text-muted-foreground">{t("tax.subtitle")}</p>
        </div>
        <Button onClick={() => setIsAddJurisdictionOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("tax.addJurisdictionButton")}
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("tax.jurisdictions")}</CardTitle>
          <Select value={currentJurisdiction?.id || ""} onValueChange={setCurrentJurisdiction}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t("tax.selectJurisdiction")} />
            </SelectTrigger>
            <SelectContent>
              {taxJurisdictions.map((jurisdiction) => (
                <SelectItem key={jurisdiction.id} value={jurisdiction.id}>
                  {jurisdiction.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("tax.name")}</TableHead>
                <TableHead>{t("tax.code")}</TableHead>
                <TableHead>{t("tax.rules")}</TableHead>
                <TableHead>{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxJurisdictions.length > 0 ? (
                taxJurisdictions.map((jurisdiction) => (
                  <TableRow key={jurisdiction.id}>
                    <TableCell className="font-medium">{jurisdiction.name}</TableCell>
                    <TableCell>{jurisdiction.code}</TableCell>
                    <TableCell>{t("tax.rulesCount", { count: jurisdiction.rules.length })}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setCurrentJurisdictionEdit(jurisdiction)
                            setIsEditJurisdictionOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => removeJurisdiction(jurisdiction.id)}
                          disabled={jurisdiction.id === currentJurisdiction?.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="py-8">
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <Calculator className="h-6 w-6" />
                        </EmptyMedia>
                        <EmptyTitle>{t("tax.noJurisdictions")}</EmptyTitle>
                        <EmptyDescription>
                          {t("tax.createFirstJurisdictionDesc")}
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {currentJurisdiction && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("tax.rulesFor", { name: currentJurisdiction.name })}</CardTitle>
            <Button onClick={() => setIsAddRuleOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("tax.addRuleButton")}
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("tax.name")}</TableHead>
                  <TableHead>{t("tax.rate")}</TableHead>
                  <TableHead>{t("tax.appliesTo")}</TableHead>
                  <TableHead>{t("tax.default")}</TableHead>
                  <TableHead>{t("tax.exempt")}</TableHead>
                  <TableHead>{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentJurisdiction.rules.length > 0 ? (
                  currentJurisdiction.rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell>{rule.rate}%</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {rule.appliesTo === "all"
                            ? t("tax.allProducts")
                            : rule.appliesTo === "category"
                              ? t("tax.specificCategories")
                              : t("tax.specificProducts")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {rule.isDefault ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {rule.isExempt ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setCurrentRuleEdit(rule)
                              setIsEditRuleOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => removeTaxRule(currentJurisdiction.id, rule.id)}
                            disabled={rule.isDefault}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8">
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <Calculator className="h-6 w-6" />
                          </EmptyMedia>
                          <EmptyTitle>{t("tax.noRules")}</EmptyTitle>
                          <EmptyDescription>
                            {t("tax.addFirstRuleDescription")}
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add Jurisdiction Dialog */}
      <Dialog open={isAddJurisdictionOpen} onOpenChange={setIsAddJurisdictionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("tax.addJurisdiction")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("tax.jurisdictionName")}</Label>
              <Input
                id="name"
                value={newJurisdiction.name}
                onChange={(e) => setNewJurisdiction({ ...newJurisdiction, name: e.target.value })}
                placeholder={t("tax.jurisdictionPlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">{t("tax.jurisdictionCode")}</Label>
              <Input
                id="code"
                value={newJurisdiction.code}
                onChange={(e) => setNewJurisdiction({ ...newJurisdiction, code: e.target.value })}
                placeholder="CA"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddJurisdictionOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleAddJurisdiction}>{t("tax.addJurisdictionButton")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Jurisdiction Dialog */}
      <Dialog open={isEditJurisdictionOpen} onOpenChange={setIsEditJurisdictionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("tax.editJurisdiction")}</DialogTitle>
          </DialogHeader>
          {currentJurisdictionEdit && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">{t("tax.jurisdictionName")}</Label>
                <Input
                  id="edit-name"
                  value={currentJurisdictionEdit.name}
                  onChange={(e) => setCurrentJurisdictionEdit({ ...currentJurisdictionEdit, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-code">{t("tax.jurisdictionCode")}</Label>
                <Input
                  id="edit-code"
                  value={currentJurisdictionEdit.code}
                  onChange={(e) => setCurrentJurisdictionEdit({ ...currentJurisdictionEdit, code: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditJurisdictionOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleEditJurisdiction}>{t("common.saveChanges")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Tax Rule Dialog */}
      <Dialog open={isAddRuleOpen} onOpenChange={setIsAddRuleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("tax.addRule")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rule-name">{t("tax.ruleName")}</Label>
              <Input
                id="rule-name"
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                placeholder={t("tax.ratePlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rule-rate">{t("tax.rate")} (%)</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Calculator className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  id="rule-rate"
                  type="number"
                  value={newRule.rate}
                  onChange={(e) => setNewRule({ ...newRule, rate: Number.parseFloat(e.target.value) || 0 })}
                  className="pl-9"
                  placeholder="8.5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rule-applies-to">{t("tax.appliesTo")}</Label>
              <Select
                value={newRule.appliesTo}
                onValueChange={(value: "all" | "category" | "product") => setNewRule({ ...newRule, appliesTo: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("tax.selectWhereAppliesPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("tax.allProducts")}</SelectItem>
                  <SelectItem value="category">{t("tax.specificCategories")}</SelectItem>
                  <SelectItem value="product">{t("tax.specificProducts")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <SwitchRow>
                <Label htmlFor="rule-default">{t("tax.defaultRule")}</Label>
                <Switch
                  id="rule-default"
                  checked={newRule.isDefault}
                  onCheckedChange={(checked) => setNewRule({ ...newRule, isDefault: checked })}
                />
              </SwitchRow>
              <p className="text-xs text-muted-foreground">
                {t("tax.defaultRuleDescription")}
              </p>
            </div>

            <div className="space-y-2">
              <SwitchRow>
                <Label htmlFor="rule-exempt">{t("tax.taxExempt")}</Label>
                <Switch
                  id="rule-exempt"
                  checked={newRule.isExempt}
                  onCheckedChange={(checked) => setNewRule({ ...newRule, isExempt: checked })}
                />
              </SwitchRow>
              <p className="text-xs text-muted-foreground">{t("tax.exemptDescription")}</p>
            </div>
          </div>
          <DialogFooter>
<Button variant="outline" onClick={() => setIsAddRuleOpen(false)}>
            {t("common.cancel")}
            </Button>
            <Button onClick={handleAddRule}>{t("tax.addRuleButton")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Tax Rule Dialog */}
      <Dialog open={isEditRuleOpen} onOpenChange={setIsEditRuleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("tax.editRule")}</DialogTitle>
          </DialogHeader>
          {currentRuleEdit && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-rule-name">{t("tax.ruleName")}</Label>
                <Input
                  id="edit-rule-name"
                  value={currentRuleEdit.name}
                  onChange={(e) => setCurrentRuleEdit({ ...currentRuleEdit, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-rule-rate">{t("tax.rate")} (%)</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Calculator className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    id="edit-rule-rate"
                    type="number"
                    value={currentRuleEdit.rate}
                    onChange={(e) =>
                      setCurrentRuleEdit({ ...currentRuleEdit, rate: Number.parseFloat(e.target.value) || 0 })
                    }
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-rule-applies-to">{t("tax.appliesTo")}</Label>
                <Select
                  value={currentRuleEdit.appliesTo}
                  onValueChange={(value: "all" | "category" | "product") =>
                    setCurrentRuleEdit({ ...currentRuleEdit, appliesTo: value })
                  }
                >
                  <SelectTrigger>
<SelectValue placeholder={t("tax.selectWhereAppliesPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("tax.allProducts")}</SelectItem>
                      <SelectItem value="category">{t("tax.specificCategories")}</SelectItem>
                      <SelectItem value="product">{t("tax.specificProducts")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <SwitchRow>
                    <Label htmlFor="edit-rule-default">{t("tax.defaultRule")}</Label>
                    <Switch
                      id="edit-rule-default"
                      checked={currentRuleEdit.isDefault}
                      onCheckedChange={(checked) => setCurrentRuleEdit({ ...currentRuleEdit, isDefault: checked })}
                    />
                  </SwitchRow>
                </div>

              <div className="space-y-2">
                <SwitchRow>
                  <Label htmlFor="edit-rule-exempt">{t("tax.taxExempt")}</Label>
                  <Switch
                    id="edit-rule-exempt"
                    checked={currentRuleEdit.isExempt}
                    onCheckedChange={(checked) => setCurrentRuleEdit({ ...currentRuleEdit, isExempt: checked })}
                  />
                </SwitchRow>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditRuleOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleEditRule}>{t("common.saveChanges")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
